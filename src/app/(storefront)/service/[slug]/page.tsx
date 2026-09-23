import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { permanentRedirect } from 'next/navigation'
import BrandPostPage, { brandPostMetadata, type BrandPostProps } from '@/components/storefront/BrandPostPage'
import { getBrandLegacyPath, getBrandSite } from '@/utils/brandSites'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
export const revalidate = 60
export const generateMetadata = (props: BrandPostProps) => brandPostMetadata(props, 'service')
export default async function Page(props: BrandPostProps) {
  const slug = (await props.params).slug
  const config = await getStorefrontConfigForServer(await getLocale(), (await headers()).get('host') || undefined)
  const brand = getBrandSite(config)
  const path = brand ? getBrandLegacyPath(brand, 'services', slug) : undefined
  if (path && path !== `/service/${slug}`) permanentRedirect(path)
  return <BrandPostPage {...props} section='service' />
}
