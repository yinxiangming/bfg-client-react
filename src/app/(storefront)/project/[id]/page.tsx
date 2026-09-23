import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { notFound, permanentRedirect } from 'next/navigation'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { getBrandLegacyPath, getBrandSite } from '@/utils/brandSites'

export default async function LegacyProject({ params }: { params: Promise<{ id: string }> }) {
  const brand = getBrandSite(await getStorefrontConfigForServer(await getLocale(), (await headers()).get('host') || undefined))
  const path = brand ? getBrandLegacyPath(brand, 'projects', (await params).id) : undefined
  if (!path) notFound()
  permanentRedirect(path)
}
