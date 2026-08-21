import { cache } from 'react'
import { headers } from 'next/headers'
import { getSiteConfig } from '@/utils/siteMetadata'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { getMediaUrl } from '@/utils/media'
import { storefrontApi } from '@/utils/storefrontApi'
import {
  getRequestOrigin,
  toAbsolute,
  clampDescription,
  buildBreadcrumbJsonLd,
  jsonLdScript,
  openGraphLocale,
} from '@/utils/seo'
import ProductDetailPage from '@views/storefront/ProductDetailPage'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

type ProductCategory = { id: number; name: string; slug: string }

type ProductMeta = {
  id: number | string
  slug: string | null
  name: string
  description: string | null
  short_description: string | null
  primary_image: string | null
  images: string[]
  price: string
  compare_price: string | null
  sku: string | null
  brand: string | null
  meta_title: string | null
  meta_description: string | null
  condition: string | null
  rating: number | null
  reviews_count: number
  stock_quantity: number | null
  categories: ProductCategory[]
  variants: { stock_available?: number; sku?: string }[]
}

async function fetchProductRaw(id: string, requestHost?: string): Promise<ProductMeta | null> {
  try {
    const data = await storefrontApi.getProduct(id, {
      requestHost,
      next: { revalidate: 300 },
    })
    if (!data?.name) return null
    return {
      id: data.id ?? id,
      slug: data.slug ?? null,
      name: data.name ?? '',
      description: data.description ?? null,
      short_description: data.short_description ?? null,
      primary_image: data.primary_image ?? null,
      images: Array.isArray(data.images) ? data.images : [],
      price: data.price ?? '0',
      compare_price: data.compare_price ?? null,
      sku: data.sku ?? null,
      brand: data.brand ?? null,
      meta_title: data.meta_title ?? null,
      meta_description: data.meta_description ?? null,
      condition: data.condition ?? null,
      rating: data.rating ?? null,
      reviews_count: data.reviews_count ?? 0,
      stock_quantity: data.stock_quantity ?? null,
      categories: Array.isArray(data.categories) ? data.categories : [],
      variants: data.variants || [],
    }
  } catch {
    return null
  }
}

/** Deduped per request so metadata, JSON-LD and the page body share one fetch. */
const getProductForServer = cache(fetchProductRaw)

/**
 * Products resolve by both numeric id and slug, so `/product/75` and
 * `/product/round-wearable-microcontroller-board` serve identical content. Without a canonical
 * that picks one, the two URLs compete for the same ranking. The slug form wins: it carries
 * keywords and is what the sitemap lists.
 */
function canonicalPath(product: ProductMeta | null, requested: string): string {
  return `/product/${product?.slug || requested}`
}

function totalStock(product: ProductMeta): number {
  if (product.variants?.length) {
    return product.variants.reduce((sum, v) => sum + (v.stock_available ?? 0), 0)
  }
  return product.stock_quantity ?? 0
}

/** One year out — Google treats a missing `priceValidUntil` as a soft warning on Offers. */
function priceValidUntil(): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

function buildProductJsonLd(
  product: ProductMeta,
  origin: string,
  currency: string,
  siteName: string,
  path: string,
  country?: string
) {
  const url = origin ? `${origin}${path}` : undefined
  const images = (product.images?.length
    ? product.images
    : product.primary_image
      ? [product.primary_image]
      : []
  )
    .map((img) => toAbsolute(origin, getMediaUrl(img)))
    .filter((u): u is string => Boolean(u))

  const stock = totalStock(product)
  const description =
    clampDescription(product.description || product.short_description, 5000) || product.name

  const rating =
    product.rating && product.reviews_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviews_count,
        }
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url ? `${url}#product` : undefined,
    name: product.name,
    description,
    image: images.length ? images : undefined,
    sku: product.sku || product.variants?.[0]?.sku || String(product.id),
    mpn: product.sku || undefined,
    brand: { '@type': 'Brand', name: product.brand || siteName },
    category: product.categories?.[0]?.name || undefined,
    aggregateRating: rating,
    offers: {
      '@type': 'Offer',
      url,
      price: product.price,
      priceCurrency: currency,
      priceValidUntil: priceValidUntil(),
      itemCondition:
        product.condition?.toLowerCase() === 'used'
          ? 'https://schema.org/UsedCondition'
          : 'https://schema.org/NewCondition',
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: siteName },
      // Only claim a shipping destination the workspace has actually declared.
      shippingDetails: country
        ? {
            '@type': 'OfferShippingDetails',
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: country },
          }
        : undefined,
    },
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const requestHost = headersList.get('host') ?? undefined
  const [product, { site_name }, origin, config] = await Promise.all([
    getProductForServer(id, requestHost),
    // requestHost is required here — without it the backend cannot resolve the workspace and
    // site_name falls back to the placeholder 'Web App'.
    getSiteConfig(locale, requestHost),
    getRequestOrigin(),
    getStorefrontConfigForServer(locale, requestHost).catch(() => null),
  ])

  if (!product) {
    return { title: 'Product not found', robots: { index: false, follow: true } }
  }

  const path = canonicalPath(product, id)
  const canonical = origin ? `${origin}${path}` : path
  // Hand-written SEO overrides win; otherwise derive from the product copy, and only
  // fall back to a generated sentence when the product has no copy at all.
  const title = product.meta_title?.trim() || product.name
  const description =
    clampDescription(product.meta_description || product.description || product.short_description) ||
    `Buy ${product.name} from ${site_name}.`
  const imageUrl =
    toAbsolute(origin, getMediaUrl(product.primary_image || product.images?.[0] || '')) || undefined

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: site_name,
      locale: openGraphLocale(locale, config?.country),
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

export default async function Page(props: Props) {
  const { id } = await props.params
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const requestHost = headersList.get('host') ?? undefined

  const [product, config, origin] = await Promise.all([
    getProductForServer(id, requestHost),
    getStorefrontConfigForServer(locale, requestHost).catch(() => null),
    getRequestOrigin(),
  ])

  const siteName = config?.site_name?.trim() || ''
  // Structured-data price must match the price on the page, so read the store's own currency
  // rather than asserting one here.
  const currency = (config?.default_currency || '').toUpperCase()
  const path = canonicalPath(product, id)

  const breadcrumb = product
    ? buildBreadcrumbJsonLd(origin, [
        { name: 'Home', path: '/' },
        ...(product.categories?.[0]
          ? [
              {
                name: product.categories[0].name,
                path: `/category/${product.categories[0].slug}`,
              },
            ]
          : []),
        { name: product.name, path },
      ])
    : null

  return (
    <>
      {product && (
        <>
          {/* An Offer without a currency is invalid structured data, so skip the whole
              Product node rather than emit a price with no unit. */}
          {currency && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: jsonLdScript(
                  buildProductJsonLd(product, origin, currency, siteName, path, config?.country)
                ),
              }}
            />
          )}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
          />
        </>
      )}
      {/* initialProduct renders the real product markup in the SSR HTML instead of a
          loading placeholder, which is all a crawler ever sees. */}
      <ProductDetailPage productId={id} initialProduct={product ?? undefined} />
    </>
  )
}
