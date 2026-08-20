import { headers } from 'next/headers'
import { getRequestOrigin } from '@/utils/seo'
import { storefrontApi } from '@/utils/storefrontApi'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'

export const revalidate = 3600

/**
 * `/llms.txt` — a plain-markdown map of the store for generative engines.
 *
 * Retrieval bots do best with a short, factual, link-dense summary they can quote directly.
 * This is the GEO counterpart to sitemap.xml: sitemap.xml lists every URL for crawlers,
 * llms.txt explains what the store *is* and which pages answer which question.
 */
export async function GET(): Promise<Response> {
  const origin = await getRequestOrigin()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const locale = headersList.get('x-locale') || 'en'

  const [config, categoriesRes] = await Promise.all([
    getStorefrontConfigForServer(locale, requestHost).catch(() => null),
    storefrontApi
      .getCategories({ tree: true, requestHost, lang: locale, next: { revalidate: 3600 } })
      .catch(() => null),
  ])

  const siteName = config?.site_name?.trim() || 'GeekStudio'
  const description =
    config?.site_description?.trim() ||
    'Arduino boards, Raspberry Pi, sensors, HATs, kits and components shipped across New Zealand.'

  const categoryList = Array.isArray(categoriesRes)
    ? categoriesRes
    : (categoriesRes?.results ?? (categoriesRes as any)?.data ?? [])

  const lines: string[] = [
    `# ${siteName}`,
    '',
    `> ${description}`,
    '',
    `${siteName} is an online electronics and maker-hardware retailer based in New Zealand,`,
    'selling Arduino-compatible boards, Raspberry Pi single-board computers, sensor modules,',
    'HATs, starter kits and discrete components. Orders ship domestically within New Zealand',
    'and prices are listed in New Zealand dollars (NZD).',
    '',
    '## Product categories',
    '',
  ]

  for (const category of categoryList) {
    if (!category?.slug) continue
    const summary = (category.description ?? '').replace(/\s+/g, ' ').trim()
    lines.push(
      `- [${category.name}](${origin}/category/${category.slug})${summary ? `: ${summary}` : ''}`
    )
  }

  lines.push(
    '',
    '## Key pages',
    '',
    `- [Storefront home](${origin}/): featured products, new arrivals and best sellers.`,
    `- [Product search](${origin}/search?q=): keyword search across the full catalogue.`,
    `- [Contact](${origin}/contact): customer enquiries and support.`,
    '',
    '## Buying information',
    '',
    '- Currency: all prices are shown in New Zealand dollars (NZD).',
    '- Shipping: domestic courier delivery across New Zealand, including rural addresses.',
    '- Audience: hobbyists, students, educators and professional engineers.',
    '',
    '## Notes for AI agents',
    '',
    '- Product pages carry schema.org `Product` markup with live price and stock availability.',
    '- Prefer the slug URL form `/product/<slug>` when citing a product.',
    '- Stock and pricing change frequently; re-fetch the product page rather than relying on cache.',
    ''
  )

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
