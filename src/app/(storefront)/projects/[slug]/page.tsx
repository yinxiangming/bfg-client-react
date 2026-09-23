import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { permanentRedirect } from 'next/navigation'
import BrandPostPage, { brandPostMetadata, type BrandPostProps } from '@/components/storefront/BrandPostPage'
import BrandProjectCategoryPage, { brandProjectCategoryMetadata } from '@/components/storefront/BrandProjectCategoryPage'
import { getBrandLegacyPath, getBrandSite } from '@/utils/brandSites'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
export const revalidate = 60
export async function generateMetadata(props: BrandPostProps) {
  const slug = (await props.params).slug
  return slug === 'residential' || slug === 'commercial'
    ? brandProjectCategoryMetadata(props)
    : brandPostMetadata(props, 'projects')
}
export default async function Page(props: BrandPostProps) {
  const slug = (await props.params).slug
  const config = await getStorefrontConfigForServer(await getLocale(), (await headers()).get('host') || undefined)
  const brand = getBrandSite(config)
  const path = brand ? getBrandLegacyPath(brand, 'projects', slug) : undefined
  if (path && path !== `/projects/${slug}`) permanentRedirect(path)
  return slug === 'residential' || slug === 'commercial'
    ? <BrandProjectCategoryPage {...props} />
    : <BrandPostPage {...props} section='projects' />
}
