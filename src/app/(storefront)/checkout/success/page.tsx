import { headers } from 'next/headers'
import { getSiteConfig } from '@/utils/siteMetadata'
import { resolveStorefrontPage } from '@/components/storefront/themes/resolve'
import CheckoutSuccessPage from '@/views/storefront/CheckoutSuccessPage'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const { site_name } = await getSiteConfig(locale)
  return { title: `Order Success | ${site_name}` }
}

export default async function Page() {
  const Override = await resolveStorefrontPage('checkout/success')
  const Component = Override ?? CheckoutSuccessPage
  return <Component />
}
