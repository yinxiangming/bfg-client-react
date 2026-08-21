import { cache } from 'react'
import { headers } from 'next/headers'
import { getSiteConfig } from '@/utils/siteMetadata'
import { storefrontApi } from '@/utils/storefrontApi'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import {
  getRequestOrigin,
  clampDescription,
  buildBreadcrumbJsonLd,
  jsonLdScript,
  openGraphLocale,
} from '@/utils/seo'
import CategoryPage from '@views/storefront/CategoryPage'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

type CategoryNode = {
  name: string
  description: string
  children: { slug: string; name: string }[]
}

/** Must match `productsPerPage` in the view so the server seed fills exactly page 1. */
const PRODUCTS_PER_PAGE = 12

function walkTree(items: any[], slug: string): CategoryNode | null {
  for (const c of items ?? []) {
    if (c.slug === slug) {
      return {
        name: c.name ?? slug,
        description: c.description ?? '',
        children: (c.children ?? [])
          .filter((ch: any) => ch?.slug && ch?.name)
          .map((ch: any) => ({ slug: ch.slug as string, name: ch.name as string })),
      }
    }
    if (c.children?.length) {
      const found = walkTree(c.children, slug)
      if (found) return found
    }
  }
  return null
}

async function fetchCategoryData(slug: string, requestHost: string | undefined, locale: string) {
  const [categoriesRes, productsRes] = await Promise.all([
    storefrontApi
      .getCategories({ tree: true, requestHost, lang: locale, next: { revalidate: 300 } })
      .catch(() => null),
    storefrontApi
      .getProducts({
        category: slug,
        limit: PRODUCTS_PER_PAGE,
        requestHost,
        next: { revalidate: 300 },
      })
      .catch(() => null),
  ])

  const list = Array.isArray(categoriesRes)
    ? categoriesRes
    : (categoriesRes?.results ?? (categoriesRes as any)?.data ?? [])
  const products = Array.isArray(productsRes)
    ? productsRes
    : (productsRes?.results ?? (productsRes as any)?.data ?? [])

  return {
    category: walkTree(list, slug),
    products,
    totalCount: (productsRes as any)?.count ?? products.length,
  }
}

/** Deduped per request: metadata, JSON-LD and the page body share one round trip. */
const getCategoryForServer = cache(fetchCategoryData)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const requestHost = headersList.get('host') ?? undefined

  const [data, { site_name }, origin, config] = await Promise.all([
    getCategoryForServer(slug, requestHost, locale),
    // requestHost is required: without it the workspace cannot be resolved and every title
    // degrades to the 'Web App' placeholder.
    getSiteConfig(locale, requestHost),
    getRequestOrigin(),
    getStorefrontConfigForServer(locale, requestHost).catch(() => null),
  ])

  const name = data.category?.name ?? slug
  const canonical = origin ? `${origin}/category/${slug}` : `/category/${slug}`
  const description =
    clampDescription(data.category?.description) ||
    `Shop ${name} at ${site_name} — ${data.totalCount} products in stock.`

  return {
    title: name,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${name} | ${site_name}`,
      description,
      type: 'website',
      url: canonical,
      siteName: site_name,
      locale: openGraphLocale(locale, config?.country),
    },
    twitter: { card: 'summary_large_image', title: `${name} | ${site_name}`, description },
  }
}

export default async function Page(props: Props) {
  const { slug } = await props.params
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const requestHost = headersList.get('host') ?? undefined

  const [data, origin] = await Promise.all([
    getCategoryForServer(slug, requestHost, locale),
    getRequestOrigin(),
  ])

  const name = data.category?.name ?? slug

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: clampDescription(data.category?.description, 5000) || undefined,
    url: origin ? `${origin}/category/${slug}` : undefined,
    // ItemList gives generative engines an extractable list of what this category contains.
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.totalCount,
      itemListElement: (data.products ?? []).slice(0, PRODUCTS_PER_PAGE).map((p: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: origin ? `${origin}/product/${p.slug || p.id}` : undefined,
      })),
    },
  }

  const breadcrumb = buildBreadcrumbJsonLd(origin, [
    { name: 'Home', path: '/' },
    { name, path: `/category/${slug}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />
      <CategoryPage
        slug={slug}
        initialData={{
          products: data.products ?? [],
          totalCount: data.totalCount,
          category: data.category
            ? { name: data.category.name, description: data.category.description }
            : null,
          subcategories: data.category?.children ?? [],
        }}
      />
    </>
  )
}
