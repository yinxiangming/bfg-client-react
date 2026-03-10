import { cache } from 'react'
import { headers } from 'next/headers'
import { getApiBaseUrl, getApiHeaders, getSiteBaseUrl } from '@/utils/api'
import { getSiteConfig } from '@/utils/siteMetadata'
import { getMediaUrl } from '@/utils/media'
import ProductDetailPage from '@views/storefront/ProductDetailPage'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

type ProductMeta = {
  name: string
  description: string | null
  primary_image: string | null
  images: string[]
  price: string
  sku: string | null
  brand: string | null
  variants: { stock_available?: number }[]
}

async function fetchProductRaw(id: string): Promise<ProductMeta | null> {
  try {
    const base = getApiBaseUrl()
    const res = await fetch(`${base}/api/v1/store/products/${id}/`, {
      headers: getApiHeaders(),
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const variants = data?.variants || []
    return {
      name: data?.name ?? '',
      description: data?.description ?? null,
      primary_image: data?.primary_image ?? null,
      images: Array.isArray(data?.images) ? data.images : [],
      price: data?.price ?? '0',
      sku: data?.sku ?? null,
      brand: data?.brand ?? null,
      variants,
    }
  } catch {
    return null
  }
}

const getProductForServer = cache(fetchProductRaw)

function toAbsoluteImage(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = getSiteBaseUrl()
  return base ? `${base}${url.startsWith('/') ? url : `/${url}`}` : url
}

function buildProductJsonLd(id: string, product: ProductMeta) {
  const siteBase = getSiteBaseUrl()
  const url = siteBase ? `${siteBase}/product/${id}` : undefined
  const imageList = product.images?.length
    ? product.images.map((img: string) => toAbsoluteImage(getMediaUrl(img)))
    : product.primary_image
      ? [toAbsoluteImage(getMediaUrl(product.primary_image))]
      : []
  const availability = product.variants?.some((v: any) => (v.stock_available ?? 0) > 0)
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: imageList.length ? imageList : undefined,
    sku: product.sku || undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'NZD',
      availability,
      url,
    },
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const [product, { site_name }] = await Promise.all([
    getProductForServer(id),
    getSiteConfig(locale),
  ])
  const title = product?.name ?? `Product ${id}`
  const fullTitle = `${title} | ${site_name}`
  const description =
    product?.description?.replace(/\s+/g, ' ').slice(0, 160) || `${title} – ${site_name}`
  const imageUrl = product?.primary_image
    ? toAbsoluteImage(getMediaUrl(product.primary_image))
    : product?.images?.[0]
      ? toAbsoluteImage(getMediaUrl(product.images[0]))
      : null

  const openGraph: Metadata['openGraph'] = {
    title: fullTitle,
    description,
    type: 'website',
    ...(imageUrl && {
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    }),
  }
  const twitter: Metadata['twitter'] = {
    card: 'summary_large_image',
    title: fullTitle,
    description,
    ...(imageUrl && { images: [imageUrl] }),
  }

  return {
    title: fullTitle,
    description,
    openGraph,
    twitter,
  }
}

export default async function Page(props: Props) {
  const { id } = await props.params
  const product = await getProductForServer(id)

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildProductJsonLd(id, product)),
          }}
        />
      )}
      <ProductDetailPage productId={id} />
    </>
  )
}
