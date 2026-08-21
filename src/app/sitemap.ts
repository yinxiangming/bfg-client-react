import { headers } from 'next/headers'
import { getRequestOrigin } from '@/utils/seo'
import { storefrontApi } from '@/utils/storefrontApi'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import type { MetadataRoute } from 'next'

export const revalidate = 3600

/** API max page size (config.pagination.StandardPagination). */
const API_MAX_PAGE_SIZE = 200
/** Safety stop; Google's per-sitemap limit is 50k URLs. */
const MAX_PRODUCT_PAGES = 25

/** Walk every page of the catalogue — a single request only ever returns one page. */
async function fetchAllProducts(requestHost: string | undefined): Promise<any[]> {
  const all: any[] = []
  for (let page = 1; page <= MAX_PRODUCT_PAGES; page++) {
    const res = await storefrontApi
      .getProducts({
        limit: API_MAX_PAGE_SIZE,
        page,
        requestHost,
        next: { revalidate: 3600 },
      })
      .catch(() => null)
    const batch = Array.isArray(res) ? res : (res?.results ?? (res as any)?.data ?? [])
    if (!batch.length) break
    all.push(...batch)
    const total = (res as any)?.count
    if (typeof total === 'number' && all.length >= total) break
    if (batch.length < API_MAX_PAGE_SIZE) break
  }
  return all
}

type SitemapEntry = MetadataRoute.Sitemap[number]

function entry(
  url: string,
  changeFrequency: SitemapEntry['changeFrequency'],
  priority: number,
  lastModified?: string | Date
): SitemapEntry {
  return { url, changeFrequency, priority, lastModified: lastModified ?? new Date() }
}

/** Flatten the category tree so child categories are indexed too. */
function flattenCategories(items: any[], out: any[] = []): any[] {
  for (const item of items ?? []) {
    if (item?.slug) out.push(item)
    if (item?.children?.length) flattenCategories(item.children, out)
  }
  return out
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getRequestOrigin()
  if (!origin) return []

  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const locale = headersList.get('x-locale') || 'en'

  const [config, categoriesRes, productList] = await Promise.all([
    getStorefrontConfigForServer(locale, requestHost).catch(() => null),
    storefrontApi
      .getCategories({ tree: true, requestHost, lang: locale, next: { revalidate: 3600 } })
      .catch(() => null),
    fetchAllProducts(requestHost),
  ])

  const entries: SitemapEntry[] = [
    entry(`${origin}/`, 'daily', 1.0),
    entry(`${origin}/contact`, 'yearly', 0.3),
  ]

  const categoryList = Array.isArray(categoriesRes)
    ? categoriesRes
    : (categoriesRes?.results ?? (categoriesRes as any)?.data ?? [])
  for (const category of flattenCategories(categoryList)) {
    entries.push(entry(`${origin}/category/${category.slug}`, 'daily', 0.8))
  }

  for (const product of productList) {
    // Slug URLs are canonical; numeric-id URLs resolve to the same page and are excluded.
    const handle = product?.slug || product?.id
    if (!handle) continue
    entries.push(
      entry(`${origin}/product/${handle}`, 'weekly', 0.7, product?.updated_at ?? undefined)
    )
  }

  // CMS pages exposed through the footer/header menus (About, Delivery, Terms…).
  const menuItems = [...(config?.header_menus ?? []), ...(config?.footer_menus ?? [])]
  const seen = new Set(entries.map((e) => e.url))
  for (const item of menuItems) {
    if (item.kind !== 'page' || !item.page_slug) continue
    const url = `${origin}/${item.page_slug}`
    if (seen.has(url)) continue
    seen.add(url)
    entries.push(entry(url, 'monthly', 0.5))
  }

  return entries
}
