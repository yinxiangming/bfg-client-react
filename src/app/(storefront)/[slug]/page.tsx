import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getSiteConfig } from '@/utils/siteMetadata'
import { getRequestOrigin, clampDescription } from '@/utils/seo'
import { fetchRenderedCmsPage } from '@/services/storefrontCmsApi'
import { resolveCmsBlocks } from '@/utils/resolveCmsBlocks'
import DynamicPage from '@views/storefront/DynamicPage'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

/** Browser probes that must not hit CMS page API (see app/icon.svg for favicon). */
const RESERVED_ASSET_SLUGS = new Set([
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'manifest.webmanifest',
  'site.webmanifest',
])

async function getPageData(slug: string, locale: string, requestHost?: string) {
  if (RESERVED_ASSET_SLUGS.has(slug)) return null
  return fetchRenderedCmsPage(slug, locale, requestHost, { revalidate: 60 })
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const locale = await getLocale()
  const requestHost = (await headers()).get('host') ?? undefined
  const [pageData, { site_name }, origin] = await Promise.all([
    getPageData(slug, locale, requestHost),
    getSiteConfig(locale, requestHost),
    getRequestOrigin(),
  ])
  const title = (pageData?.meta_title || pageData?.title || slug) as string
  const description =
    clampDescription((pageData?.meta_description || pageData?.excerpt) as string | undefined) ||
    `${title} – ${site_name}`
  const canonical = origin ? `${origin}/${slug}` : `/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'article', title, description, url: canonical, siteName: site_name },
    twitter: { card: 'summary_large_image', title, description },
  }
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
  const rawPageData = await getPageData(slug, locale, requestHost)
  if (!rawPageData || !rawPageData.blocks?.length) {
    notFound()
  }
  const pageData = await resolveCmsBlocks(rawPageData, requestHost, locale)

  return <DynamicPage pageData={pageData} locale={locale} />
}
