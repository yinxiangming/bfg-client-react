import { headers } from 'next/headers'
import { getSiteConfig } from '@/utils/siteMetadata'
import { resolveStorefrontPage } from '@/components/storefront/themes/resolve'
import CheckoutPage from '@views/storefront/CheckoutPage'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const locale = headersList.get('x-locale') || 'en'
  const { site_name } = await getSiteConfig(locale)
  return { title: `Checkout | ${site_name}` }
}

export default async function CheckoutPageRoute() {
  const Override = await resolveStorefrontPage('checkout')
  const Component = Override ?? CheckoutPage
  return <Component />
}
