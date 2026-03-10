import { Suspense } from 'react'
import { getLocale } from 'next-intl/server'
import { getSiteConfig } from '@/utils/siteMetadata'
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
  const { site_name } = await getSiteConfig(locale)
  const params = await searchParams
  const q = params?.q
  const titlePart = typeof q === 'string' ? `Search: ${q}` : Array.isArray(q) ? `Search: ${q[0]}` : 'Search'
  return { title: `${titlePart} | ${site_name}` }
}

export default function Page() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPage />
    </Suspense>
  )
}
