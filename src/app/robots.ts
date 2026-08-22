import { headers } from 'next/headers'
import { isIndexableHost } from '@/utils/indexable'
import { getRequestOrigin } from '@/utils/seo'
import type { MetadataRoute } from 'next'

/**
 * Private surfaces: never worth a crawl budget, and some (cart/checkout/account)
 * would expose per-session state to the index.
 */
const DISALLOWED = [
  '/admin',
  '/account',
  '/auth',
  '/api/',
  '/cart',
  '/checkout',
  '/unknown',
  // Sort variants are the same products in a different order — pure duplicates.
  // `page=` is deliberately NOT blocked: paginated category pages are how a crawler
  // reaches products past the first 12, and blocking them strands the rest.
  '/*?*sort=',
]

/**
 * AI crawlers, listed explicitly.
 *
 * Two distinct jobs: retrieval bots (OAI-SearchBot, PerplexityBot, ClaudeBot) fetch pages to
 * cite in answers, while Google-Extended / GPTBot gate training-corpus use. A storefront wants
 * the citations, so all are allowed the public catalogue and denied the private surfaces.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
  'Amazonbot',
  'meta-externalagent',
  'cohere-ai',
  'YouBot',
  'DuckAssistBot',
]

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getRequestOrigin()
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || ''

  // A deployment that is not the one meant to rank gets a blanket refusal, and no
  // sitemap line — advertising a catalogue is an invitation to the crawl we are
  // declining. See isIndexableHost().
  if (!isIndexableHost(host)) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOWED },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: DISALLOWED,
      })),
      // Scrapers that add no discovery value and hammer a small catalogue.
      { userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'], disallow: '/' },
    ],
    sitemap: origin ? `${origin}/sitemap.xml` : undefined,
    host: origin ? origin.replace(/^https?:\/\//, '') : undefined,
  }
}
