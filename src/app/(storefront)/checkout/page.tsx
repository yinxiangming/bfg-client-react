import { headers } from 'next/headers'
import { getSiteConfig } from '@/utils/siteMetadata'
import CheckoutPage from '@views/storefront/CheckoutPage'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const requestHost = headersList.get('host') ?? undefined
  await getSiteConfig(locale, requestHost)
  return { title: 'Checkout', robots: { index: false, follow: false } }
}

export default function CheckoutPageRoute() {
  return <CheckoutPage />
}
