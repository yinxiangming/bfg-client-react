import { cache } from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSiteConfig } from '@/utils/siteMetadata'
import { storefrontApi } from '@/utils/storefrontApi'
import {
  CATEGORY_PAGE_SIZE,
  categoryProductFilters,
  parseCategoryQuery,
  type CategoryPriceRange,
  type CategorySort
} from '@/utils/categoryCatalogue'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { resolveStorefrontPage } from '@/components/storefront/themes/resolve'
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
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type CategoryAncestor = { slug: string; name: string }

type CategoryNode = {
  name: string
  description: string
  children: { slug: string; name: string }[]
  ancestors: CategoryAncestor[]
}

function walkTree(items: any[], slug: string, ancestors: CategoryAncestor[] = []): CategoryNode | null {
  for (const c of items ?? []) {
    if (c.slug === slug) {
      return {
        name: c.name ?? slug,
        description: c.description ?? '',
        children: (c.children ?? [])
          .filter((ch: any) => ch?.slug && ch?.name)
          .map((ch: any) => ({ slug: ch.slug as string, name: ch.name as string })),
        ancestors,
      }
    }
    if (c.children?.length) {
      const found = walkTree(c.children, slug, [...ancestors, { slug: c.slug, name: c.name }])
      if (found) return found
    }
  }
  return null
}

async function fetchCategoryData(
  slug: string,
  requestHost: string | undefined,
  locale: string,
  page: number,
  price: CategoryPriceRange | null,
  sort: CategorySort
) {
  const [categoriesRes, productsRes] = await Promise.all([
    storefrontApi
      .getCategories({ tree: true, requestHost, lang: locale, next: { revalidate: 300 } })
      .catch(() => null),
    storefrontApi
      .getProducts({
        category: slug,
        limit: CATEGORY_PAGE_SIZE,
        page,
        ...categoryProductFilters(price, sort),
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
    // Whether the tree actually arrived. A failed request yields an empty list, in which
    // *every* slug looks absent — 404ing on that would take the whole catalogue offline
    // during an API blip, so only a tree we really received can prove a slug is unknown.
    treeLoaded: list.length > 0,
  }
}

/** Deduped per request: metadata, JSON-LD and the page body share one round trip. */
const getCategoryForServer = cache(fetchCategoryData)

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const { page, price, sort } = parseCategoryQuery(await searchParams)
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const requestHost = headersList.get('host') ?? undefined

  const [data, { site_name }, origin, config] = await Promise.all([
    getCategoryForServer(slug, requestHost, locale, page, price, sort),
    // requestHost is required: without it the workspace cannot be resolved and every title
    // degrades to the 'Web App' placeholder.
    getSiteConfig(locale, requestHost),
    getRequestOrigin(),
    getStorefrontConfigForServer(locale, requestHost).catch(() => null),
  ])

  if (data.treeLoaded && !data.category) {
    return { title: 'Category not found', robots: { index: false, follow: true } }
  }

  const name = data.category?.name ?? slug
  const base = origin ? `${origin}/category/${slug}` : `/category/${slug}`
  // Only the unfiltered default sort is crawlable; its pagination remains self-canonical.
  const queryVariant = price !== null || sort !== 'relevance'
  const canonical = !queryVariant && page > 1 ? `${base}?page=${page}` : base
  const description =
    clampDescription(data.category?.description) ||
    `Shop ${name} at ${site_name} — ${data.totalCount} products in stock.`

  return {
    title: name,
    description,
    alternates: { canonical },
    ...(queryVariant ? { robots: { index: false, follow: true } } : {}),
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
  const { page, price, sort } = parseCategoryQuery(await props.searchParams)
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const requestHost = headersList.get('host') ?? undefined

  const [data, origin] = await Promise.all([
    getCategoryForServer(slug, requestHost, locale, page, price, sort),
    getRequestOrigin(),
  ])

  // An unknown slug used to render an empty listing under HTTP 200 titled with the slug
  // itself — a soft 404 that Google is free to index and keeps re-crawling.
  if (data.treeLoaded && !data.category) notFound()

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
      itemListElement: (data.products ?? []).slice(0, CATEGORY_PAGE_SIZE).map((p: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: origin ? `${origin}/product/${p.slug || p.id}` : undefined,
      })),
    },
  }

  const breadcrumb = buildBreadcrumbJsonLd(origin, [
    { name: 'Home', path: '/' },
    ...(data.category?.ancestors ?? []).map(a => ({ name: a.name, path: `/category/${a.slug}` })),
    { name, path: `/category/${slug}` },
  ])

  // A skin may replace the page body but still receives the requested server-fetched results.
  const Override = await resolveStorefrontPage('category/[slug]')
  const Component = Override ?? CategoryPage

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
      <Component
        slug={slug}
        initialPage={page}
        priceRange={price}
        sortBy={sort}
        initialData={{
          products: data.products ?? [],
          totalCount: data.totalCount,
          category: data.category
            ? { name: data.category.name, description: data.category.description, ancestors: data.category.ancestors }
            : null,
          subcategories: data.category?.children ?? [],
        }}
      />
    </>
  )
}
