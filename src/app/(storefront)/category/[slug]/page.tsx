import { headers } from 'next/headers'
import { getSiteConfig } from '@/utils/siteMetadata'
import { storefrontApi } from '@/utils/storefrontApi'
import CategoryPage from '@views/storefront/CategoryPage'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

type CategoryMeta = { name: string; description: string }

async function findCategoryBySlug(
  slug: string,
  requestHost: string | undefined,
  locale: string
): Promise<CategoryMeta | null> {
  try {
    const data = await storefrontApi.getCategories({
      tree: true,
      requestHost,
      lang: locale,
      next: { revalidate: 60 },
    })
    const list = Array.isArray(data) ? data : data.results ?? data.data ?? []
    const walk = (items: any[]): CategoryMeta | null => {
      for (const c of items) {
        if (c.slug === slug) {
          return { name: c.name ?? slug, description: c.description ?? '' }
        }
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
  const requestHost = headersList.get('host') ?? undefined
  const [category, { site_name }] = await Promise.all([
    findCategoryBySlug(slug, requestHost, locale),
    getSiteConfig(locale),
  ])
  const title = category?.name ?? slug
  const fullTitle = `${title} | ${site_name}`
  const description =
    category?.description?.replace(/\s+/g, ' ').trim().slice(0, 160) ||
    `${title} – ${site_name}`

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
  }
}

export default async function Page(props: Props) {
  const params = await props.params
  return <CategoryPage slug={params.slug} />
}

