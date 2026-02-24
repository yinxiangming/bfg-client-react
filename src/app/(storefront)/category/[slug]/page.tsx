import { headers } from 'next/headers'
import { getApiBaseUrl, getApiHeaders } from '@/utils/api'
import { getSiteConfig } from '@/utils/siteMetadata'
import CategoryPage from '@views/storefront/CategoryPage'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

async function findCategoryBySlug(slug: string): Promise<{ name: string } | null> {
  try {
    const base = getApiBaseUrl()
    const res = await fetch(`${base}/api/store/categories/`, {
      headers: getApiHeaders(),
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const list = Array.isArray(data) ? data : data.results ?? data.data ?? []
    const walk = (items: any[]): { name: string } | null => {
      for (const c of items) {
        if (c.slug === slug) return { name: c.name ?? slug }
        if (c.children?.length) {
          const found = walk(c.children)
          if (found) return found
        }
      }
      return null
    }
    return walk(list)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const [category, { site_name }] = await Promise.all([
    findCategoryBySlug(slug),
    getSiteConfig(locale),
  ])
  const title = category?.name ?? slug
  return { title: `${title} | ${site_name}` }
}

export default async function Page(props: Props) {
  const params = await props.params
  return <CategoryPage slug={params.slug} />
}

