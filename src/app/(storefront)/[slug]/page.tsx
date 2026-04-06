import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getApiBaseUrl, getApiHeaders } from '@/utils/api'
import { getCmsPageFetchLanguages } from '@/utils/storefrontCmsPage'
import { getSiteConfig } from '@/utils/siteMetadata'
import DynamicPage from '@views/storefront/DynamicPage'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

/** Browser probes that must not hit CMS page API (see app/icon.svg for favicon). */
const RESERVED_ASSET_SLUGS = new Set([
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'manifest.webmanifest',
  'site.webmanifest',
])

async function getPageData(slug: string, locale: string, requestHost?: string) {
  if (RESERVED_ASSET_SLUGS.has(slug)) return null
  const langs = getCmsPageFetchLanguages(locale)
  const headerOpts = requestHost ? { requestHost, storefrontScope: true as const } : { storefrontScope: true as const }
  try {
    const apiUrl = getApiBaseUrl()
    for (const lang of langs) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(
        `${apiUrl}/api/v1/web/pages/${encodeURIComponent(slug)}/rendered/?lang=${encodeURIComponent(lang)}`,
        {
          next: { revalidate: 60 },
          headers: getApiHeaders({}, headerOpts),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)
      if (res.ok) return res.json()
    }
    return null
  } catch (error) {
    console.error('Failed to fetch page data:', error)
    return null
  }
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const locale = await getLocale()
  const requestHost = (await headers()).get('host') ?? undefined
  const [pageData, { site_name }] = await Promise.all([
    getPageData(slug, locale, requestHost),
    getSiteConfig(locale),
  ])
  const title = (pageData?.meta_title || pageData?.title || slug) as string
  return { title: `${title} | ${site_name}` }
}

const RESERVED_SLUGS = ['admin', 'account', 'auth'] as const

export default async function StorefrontSlugPage({ params }: Props) {
  const { slug } = await params
  if (RESERVED_ASSET_SLUGS.has(slug)) {
    notFound()
  }
  if (RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])) {
    if (slug === 'admin') redirect('/admin/dashboard')
    if (slug === 'account') redirect('/account')
    if (slug === 'auth') redirect('/auth/login')
  }

  const locale = await getLocale()
  const requestHost = (await headers()).get('host') ?? undefined
  const pageData = await getPageData(slug, locale, requestHost)
  if (!pageData || !pageData.blocks?.length) {
    notFound()
  }

  return <DynamicPage pageData={pageData} locale={locale} />
}
