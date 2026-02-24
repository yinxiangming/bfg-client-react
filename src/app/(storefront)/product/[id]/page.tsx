import { headers } from 'next/headers'
import { getApiBaseUrl, getApiHeaders } from '@/utils/api'
import { getSiteConfig } from '@/utils/siteMetadata'
import ProductDetailPage from '@views/storefront/ProductDetailPage'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ id: string }>
}

async function getProductName(id: string): Promise<string | null> {
  try {
    const base = getApiBaseUrl()
    const res = await fetch(`${base}/api/store/products/${id}/`, {
      headers: getApiHeaders(),
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.name ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const [name, { site_name }] = await Promise.all([
    getProductName(id),
    getSiteConfig(locale),
  ])
  const title = name ?? `Product ${id}`
  return { title: `${title} | ${site_name}` }
}

export default async function Page(props: Props) {
  const params = await props.params
  return <ProductDetailPage productId={params.id} />
}
