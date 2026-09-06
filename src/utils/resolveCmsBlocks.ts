/**
 * Resolve CMS block data on the server.
 *
 * `product_grid_v1` and `category_grid_v1` fetch their own contents from the browser, so the
 * server-rendered HTML for any page using them contains a "loading" placeholder and no product
 * links. Search and AI crawlers index that placeholder. The CMS `/rendered/` endpoint does not
 * populate `resolvedData`, so we resolve it here, before the tree is handed to the renderer.
 */

import { storefrontApi } from '@/utils/storefrontApi'

type Block = {
  id?: string
  type?: string
  settings?: Record<string, any>
  data?: Record<string, any>
  resolvedData?: unknown
  children?: Block[]
}

const RESOLVE_TIMEOUT_MS = 5000

function listOf(res: any): any[] {
  if (Array.isArray(res)) return res
  return res?.results ?? res?.data ?? []
}

/** Depth-first walk over the block tree, including `data.children` sections. */
function walk(blocks: Block[], visit: (b: Block) => void): void {
  for (const block of blocks ?? []) {
    visit(block)
    const children: Block[] = block?.data?.children ?? block?.children ?? []
    if (children.length) walk(children, visit)
  }
}

async function resolveProductGrid(block: Block, requestHost?: string): Promise<void> {
  const limit = Number(block.settings?.limit) || 8
  const productType = block.data?.productType ?? 'featured'
  const params: Record<string, unknown> = { limit, requestHost, next: { revalidate: 300 } }

  if (productType === 'featured') params.featured = true
  else if (productType === 'new') params.is_new = true
  else if (productType === 'bestseller') params.bestseller = true

  const res = await storefrontApi.getProducts(params as any)
  let products = listOf(res)

  // A brand-new catalogue often has nothing flagged featured/new/bestseller yet. An empty
  // grid renders an empty section with no crawlable links, so fall back to the plain
  // catalogue rather than shipping an empty homepage.
  if (!products.length) {
    const fallback = await storefrontApi.getProducts({
      limit,
      requestHost,
      next: { revalidate: 300 },
    } as any)
    products = listOf(fallback)
  }

  block.resolvedData = products.slice(0, limit)
}

async function resolveCategoryGrid(
  block: Block,
  requestHost: string | undefined,
  locale: string
): Promise<void> {
  const limit = Number(block.settings?.limit) || 8
  const res = await storefrontApi.getCategories({
    requestHost,
    lang: locale,
    next: { revalidate: 30 },
  })
  block.resolvedData = listOf(res).slice(0, limit)
}

/**
 * Attach `resolvedData` to every grid block in `pageData`.
 *
 * Returns a copy — the CMS payload may be shared via the React cache, and mutating it in
 * place would leak one request's data into another. Failures are swallowed per block: a
 * grid that cannot be resolved simply falls back to its client-side fetch.
 */
export async function resolveCmsBlocks(
  pageData: any,
  requestHost: string | undefined,
  locale: string
): Promise<any> {
  if (!pageData?.blocks?.length) return pageData

  const cloned = JSON.parse(JSON.stringify(pageData))
  const jobs: Promise<void>[] = []

  walk(cloned.blocks, (block) => {
    if (block.resolvedData !== undefined) return
    if (block.type === 'product_grid_v1' && block.data?.source !== 'manual') {
      jobs.push(resolveProductGrid(block, requestHost).catch(() => {}))
    } else if (block.type === 'category_grid_v1' && block.data?.source !== 'manual') {
      jobs.push(resolveCategoryGrid(block, requestHost, locale).catch(() => {}))
    }
  })

  if (!jobs.length) return cloned

  // Never let a slow API hold up the page: unresolved grids still hydrate client-side.
  await Promise.race([
    Promise.all(jobs),
    new Promise((resolve) => setTimeout(resolve, RESOLVE_TIMEOUT_MS)),
  ])

  return cloned
}
