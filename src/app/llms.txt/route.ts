import { headers } from 'next/headers'
import { getRequestOrigin, countryName } from '@/utils/seo'
import { storefrontApi } from '@/utils/storefrontApi'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'

export const revalidate = 3600

/**
 * `/llms.txt` — a plain-markdown map of the store for generative engines.
 *
 * Retrieval bots do best with a short, factual, link-dense summary they can quote directly.
 * This is the GEO counterpart to sitemap.xml: sitemap.xml lists every URL for crawlers,
 * llms.txt explains what the store *is* and which pages answer which question.
 *
 * Every fact here comes from the workspace's own settings and catalogue. Anything the
 * workspace has not filled in is left out rather than guessed — a wrong claim about what a
 * store sells or where it ships is worse for the store than a shorter file.
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

  const siteName = config?.site_name?.trim()
  if (!siteName) {
    // Without a site name there is nothing truthful to say about the store.
    return new Response('', { status: 404 })
  }

  const description = config?.site_description?.trim()
  const currency = config?.default_currency?.trim().toUpperCase()
  const market = countryName(config?.country)

  const categoryList = Array.isArray(categoriesRes)
    ? categoriesRes
    : (categoriesRes?.results ?? (categoriesRes as any)?.data ?? [])

  const lines: string[] = [`# ${siteName}`, '']
  if (description) lines.push(`> ${description}`, '')

  const facts: string[] = []
  if (market) facts.push(`${siteName} is an online store serving ${market}.`)
  if (currency) facts.push(`Prices are listed in ${currency}.`)
  if (facts.length) lines.push(facts.join(' '), '')

  const categories = categoryList.filter((c: any) => c?.slug && c?.name)
  if (categories.length) {
    lines.push('## Product categories', '')
    for (const category of categories) {
      const summary = (category.description ?? '').replace(/\s+/g, ' ').trim()
      lines.push(
        `- [${category.name}](${origin}/category/${category.slug})${summary ? `: ${summary}` : ''}`
      )
    }
    lines.push('')
  }

  lines.push(
    '## Key pages',
    '',
    `- [Home](${origin}/): featured products, new arrivals and best sellers.`,
    `- [Product search](${origin}/search?q=): keyword search across the full catalogue.`,
    ''
  )

  if (config?.contact_email || config?.contact_phone) {
    lines.push('## Contact', '')
    if (config.contact_email) lines.push(`- Email: ${config.contact_email}`)
    if (config.contact_phone) lines.push(`- Phone: ${config.contact_phone}`)
    lines.push('')
  }

  lines.push(
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
