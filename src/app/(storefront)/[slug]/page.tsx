import { getLocale } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { getApiBaseUrl, getApiHeaders } from '@/utils/api'
import { getSiteConfig } from '@/utils/siteMetadata'
import DynamicPage from '@views/storefront/DynamicPage'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

async function getPageData(slug: string, locale: string) {
  try {
    const apiUrl = getApiBaseUrl()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(`${apiUrl}/api/v1/web/pages/${slug}/rendered/?lang=${locale}`, {
      next: { revalidate: 60 },
      headers: getApiHeaders(),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    return res.json()
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
  const [pageData, { site_name }] = await Promise.all([
    getPageData(slug, locale),
    getSiteConfig(locale),
  ])
  const title = (pageData?.meta_title || pageData?.title || slug) as string
  return { title: `${title} | ${site_name}` }
}

const RESERVED_SLUGS = ['admin', 'account', 'auth'] as const

export default async function StorefrontSlugPage({ params }: Props) {
  const { slug } = await params
  if (RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])) {
    if (slug === 'admin') redirect('/admin/dashboard')
    if (slug === 'account') redirect('/account')
    if (slug === 'auth') redirect('/auth/login')
  }

  const locale = await getLocale()
  const pageData = await getPageData(slug, locale)
  if (!pageData || !pageData.blocks?.length) {
    notFound()
  }

  return <DynamicPage pageData={pageData} locale={locale} />
}
