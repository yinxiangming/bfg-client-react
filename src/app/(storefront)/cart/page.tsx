import { headers } from 'next/headers'
import { getSiteConfig } from '@/utils/siteMetadata'
import CartPage from '@views/storefront/CartPage'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const requestHost = headersList.get('host') ?? undefined
  await getSiteConfig(locale, requestHost)
  // Session-specific contents; the site-name suffix comes from the root title template.
  return { title: 'Cart', robots: { index: false, follow: true } }
}

export default function Page() {
  return <CartPage />
}
