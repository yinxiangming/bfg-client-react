import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getSiteConfig } from '@/utils/siteMetadata'
import { fetchRenderedCmsPage } from '@/services/storefrontCmsApi'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { resolveStorefrontPage } from '@/components/storefront/themes/resolve'
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

async function getPageData(slug: string, locale: string, requestHost?: string, languages?: string[]) {
  if (RESERVED_ASSET_SLUGS.has(slug)) return null
  return fetchRenderedCmsPage(slug, locale, requestHost, { revalidate: 60, languages })
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const locale = await getLocale()
  const requestHost = (await headers()).get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  const [pageData, { site_name }] = await Promise.all([
    getPageData(slug, locale, requestHost, config?.languages),
    getSiteConfig(locale, requestHost),
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
  const config = await getStorefrontConfigForServer(locale, requestHost)
  const pageData = await getPageData(slug, locale, requestHost, config?.languages)
  if (!pageData || !pageData.blocks?.length) {
    notFound()
  }

  const Override = await resolveStorefrontPage('cms')
  if (Override) {
    return <Override pageData={pageData} locale={locale} slug={slug} />
  }
  return <DynamicPage pageData={pageData} locale={locale} />
}
