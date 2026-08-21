import { Suspense } from 'react'
import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { getSiteConfig } from '@/utils/siteMetadata'
import { getRequestOrigin } from '@/utils/seo'
import { resolveStorefrontPage } from '@/components/storefront/themes/resolve'
import SearchPage from '@views/storefront/SearchPage'
import type { Metadata } from 'next'

function SearchFallback() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Loading...
    </div>
  )
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = await getLocale()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const [{ site_name }, origin, params] = await Promise.all([
    getSiteConfig(locale, requestHost),
    getRequestOrigin(),
    searchParams,
  ])
  const q = params?.q
  const term = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : ''
  const titlePart = term ? `Search: ${term}` : 'Search'

  // Result pages are thin and effectively unbounded, so keep them out of the index but let
  // crawlers follow through to the product pages they link to. The canonical points at the
  // bare /search entry point so any indexed variant consolidates there.
  return {
    title: titlePart,
    description: term
      ? `Search results for “${term}” at ${site_name}.`
      : `Search the full ${site_name} catalogue of maker electronics.`,
    robots: { index: false, follow: true },
    alternates: { canonical: origin ? `${origin}/search` : '/search' },
  }
}

export default async function Page() {
  const Override = await resolveStorefrontPage('search')
  const Component = Override ?? SearchPage
  return (
    <Suspense fallback={<SearchFallback />}>
      <Component />
    </Suspense>
  )
}
