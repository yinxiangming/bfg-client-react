import { cache } from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSiteConfig } from '@/utils/siteMetadata'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { getMediaUrl } from '@/utils/media'
import { storefrontApi } from '@/utils/storefrontApi'
import { resolveStorefrontPage } from '@/components/storefront/themes/resolve'
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
  in_stock: boolean
  purchasable: boolean
  categories: ProductCategory[]
  variants: { sku?: string }[]
}

/**
 * A missing product and an unreachable API must not share one answer. Collapsing both to
 * `null` meant either serving a soft 404 (HTTP 200 on a URL that does not exist, which
 * Google reports and keeps re-crawling) or hard-404ing a live product the moment the API
 * hiccups. `outcome` keeps them apart: only `missing` is safe to turn into a real 404.
 */
type ProductLookup =
  | { outcome: 'ok'; product: ProductMeta }
  | { outcome: 'missing' }
  | { outcome: 'error' }

async function fetchProductRaw(id: string, requestHost?: string): Promise<ProductLookup> {
  let data: any
  try {
    data = await storefrontApi.getProduct(id, {
      requestHost,
      next: { revalidate: 300 },
    })
  } catch (err) {
    return (err as { status?: number })?.status === 404
      ? { outcome: 'missing' }
      : { outcome: 'error' }
  }
  if (!data?.name) return { outcome: 'missing' }
  return {
    outcome: 'ok',
    product: {
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
      in_stock: data.in_stock ?? true,
      purchasable: data.purchasable ?? true,
      categories: Array.isArray(data.categories) ? data.categories : [],
      variants: data.variants || [],
    },
  }
}

/** Deduped per request so metadata, JSON-LD and the page body share one fetch. */
const getProductLookup = cache(fetchProductRaw)

async function getProductForServer(id: string, requestHost?: string): Promise<ProductMeta | null> {
  const lookup = await getProductLookup(id, requestHost)
  return lookup.outcome === 'ok' ? lookup.product : null
}

/**
 * Products resolve by both numeric id and slug, so `/product/75` and
 * `/product/round-wearable-microcontroller-board` serve identical content. Without a canonical
 * that picks one, the two URLs compete for the same ranking. The slug form wins: it carries
 * keywords and is what the sitemap lists.
 */
function canonicalPath(product: ProductMeta | null, requested: string): string {
  return `/product/${product?.slug || requested}`
}

/**
 * schema.org availability, taken from the server's verdict rather than counted here.
 *
 * This used to sum `stock_available` across variants and fall back to `stock_quantity`.
 * Both of those are null whenever the workspace withholds stock figures, which a sum
 * reads as zero — every product in the catalogue would have gone out to Google tagged
 * OutOfStock the moment a shop chose not to publish its numbers.
 */
function availabilityUrl(product: ProductMeta): string {
  if (product.in_stock) return 'https://schema.org/InStock'
  // Sold out but still buyable: the shop takes the order and ships on restock.
  if (product.purchasable) return 'https://schema.org/BackOrder'
  return 'https://schema.org/OutOfStock'
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
      availability: availabilityUrl(product),
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

  const [lookup, config, origin] = await Promise.all([
    getProductLookup(id, requestHost),
    getStorefrontConfigForServer(locale, requestHost).catch(() => null),
    getRequestOrigin(),
  ])

  // Genuinely absent → a real 404. An API failure still renders the shell, which retries
  // client-side, so a blip never buries a live product.
  if (lookup.outcome === 'missing') notFound()
  const product = lookup.outcome === 'ok' ? lookup.product : null

  const siteName = config?.site_name?.trim() || ''
  // Structured-data price must match the price on the page, so read the store's own currency
  // rather than asserting one here.
  const currency = (config?.default_currency || '').toUpperCase()
  const path = canonicalPath(product, id)

  // A skin may replace the page body; it still receives the server-fetched product, so an
  // override does not fall back to the loading placeholder a crawler would index.
  const Override = await resolveStorefrontPage('product/[id]')
  const Body = Override ? (
    <Override productId={id} id={id} initialProduct={product ?? undefined} />
  ) : (
    <ProductDetailPage productId={id} initialProduct={product ?? undefined} />
  )

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
      {Body}
    </>
  )
}
