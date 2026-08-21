/**
 * SEO / GEO helpers — single source of truth for absolute URLs, canonicals and JSON-LD.
 *
 * The site is multi-tenant: one deployment serves several workspace domains, so the public
 * origin must come from the *incoming request host*, not from build-time env. Using
 * `VERCEL_URL` (as `getSiteBaseUrl()` does) leaks the ephemeral preview domain into
 * canonical/OG/JSON-LD, which splits ranking signals across two hosts.
 */

import { headers } from 'next/headers'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

/** Strip port, lowercase, drop a leading `www.` so canonicals stay on one host. */
export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(':')[0].replace(/^www\./, '')
}

/**
 * Public origin for the current request, e.g. `https://shop.example.com`.
 * Order: explicit env override → forwarded/request host → Vercel URL → empty.
 */
export async function getRequestOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
  }
  try {
    const h = await headers()
    const rawHost = h.get('x-forwarded-host') || h.get('host') || ''
    if (rawHost) {
      const hostname = normalizeHost(rawHost)
      const isLocal = LOCAL_HOSTS.has(hostname)
      const proto = isLocal ? 'http' : (h.get('x-forwarded-proto') || 'https').split(',')[0]
      // Keep the port for local dev so links stay clickable.
      const hostForUrl = isLocal ? rawHost.trim().toLowerCase() : hostname
      return `${proto}://${hostForUrl}`
    }
  } catch {
    // headers() is unavailable outside a request scope — fall through.
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return ''
}

/** Join the request origin with a path to form an absolute URL. */
export async function absoluteUrl(path: string = '/'): Promise<string> {
  const origin = await getRequestOrigin()
  const suffix = path.startsWith('/') ? path : `/${path}`
  return origin ? `${origin}${suffix}` : suffix
}

/** Make a possibly-relative media URL absolute against the request origin. */
export function toAbsolute(origin: string, url?: string | null): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  if (!origin) return undefined
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

/** Collapse whitespace and clamp to `max` chars on a word boundary, for meta descriptions. */
export function clampDescription(input?: string | null, max = 158): string {
  const text = (input ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

/** ISO 3166-1 alpha-2 → display name. Unknown codes fall back to the code itself. */
const COUNTRY_NAMES: Record<string, string> = {
  AU: 'Australia',
  CA: 'Canada',
  CN: 'China',
  DE: 'Germany',
  FR: 'France',
  GB: 'United Kingdom',
  HK: 'Hong Kong',
  JP: 'Japan',
  NZ: 'New Zealand',
  SG: 'Singapore',
  US: 'United States',
}

export function countryName(code?: string): string | undefined {
  const key = code?.trim().toUpperCase()
  if (!key) return undefined
  return COUNTRY_NAMES[key] ?? key
}

export type BreadcrumbEntry = { name: string; path: string }

/** schema.org BreadcrumbList — drives the breadcrumb rich result in Google. */
export function buildBreadcrumbJsonLd(origin: string, entries: BreadcrumbEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: origin ? `${origin}${entry.path}` : entry.path,
    })),
  }
}

type OrgInput = {
  siteName: string
  description?: string
  email?: string
  phone?: string
  socials?: (string | undefined)[]
  logoUrl?: string
  /** ISO 3166-1 alpha-2 from the workspace, or empty when the store has not declared one. */
  country?: string
  /** ISO 4217 from the workspace. */
  currency?: string
}

/**
 * Organization + WebSite graph for the homepage.
 *
 * `sameAs`, contact details and the market served are what generative engines quote when
 * asked who sells a thing in a given country — so emit them whenever the workspace has them,
 * and omit them entirely when it does not. Guessing a market would put a false claim in the
 * store's own structured data.
 */
export function buildOrganizationJsonLd(origin: string, input: OrgInput) {
  const socials = (input.socials ?? []).filter((s): s is string => Boolean(s && s.trim()))
  const country = input.country?.trim().toUpperCase()
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${origin}/#organization`,
    name: input.siteName,
    url: origin || undefined,
    description: input.description || undefined,
    logo: input.logoUrl || undefined,
    image: input.logoUrl || undefined,
    email: input.email || undefined,
    telephone: input.phone || undefined,
    sameAs: socials.length ? socials : undefined,
    // schema.org Country wants a name, not an ISO code.
    areaServed: country ? { '@type': 'Country', name: countryName(country) } : undefined,
    currenciesAccepted: input.currency?.trim().toUpperCase() || undefined,
  }
}

/** WebSite node with a SearchAction so Google can surface a sitelinks search box. */
export function buildWebSiteJsonLd(
  origin: string,
  siteName: string,
  description?: string,
  inLanguage?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: siteName,
    url: origin || undefined,
    description: description || undefined,
    inLanguage: inLanguage || undefined,
    publisher: { '@id': `${origin}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** Serialize JSON-LD safely for inline `<script>` injection. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}


/**
 * BCP 47 tag for the current locale, qualified with the store's market when it has declared
 * one — `en` + `NZ` gives `en-NZ`, which tells search engines which market the store serves.
 * With no country the bare locale is returned rather than a guessed region.
 */
export function localeTag(locale: string, country?: string): string {
  const base = locale === 'zh-hans' ? 'zh-Hans' : locale
  const region = country?.trim().toUpperCase()
  if (!region || base.includes('-')) return base
  return `${base}-${region}`
}

/** Open Graph wants `xx_YY`, not a BCP 47 tag. */
export function openGraphLocale(locale: string, country?: string): string | undefined {
  const tag = localeTag(locale, country)
  return tag.includes('-') ? tag.replace('-', '_') : undefined
}
