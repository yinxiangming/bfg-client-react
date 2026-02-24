import React from 'react'
import { getLocale } from 'next-intl/server'
import { loadExtensions } from '@/extensions'
import { getPageSectionReplacements } from '@/extensions/resolve'
import { getApiBaseUrl, getApiHeaders } from '@/utils/api'
import { getSiteConfig } from '@/utils/siteMetadata'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import StorefrontDevBadge from '@components/storefront/StorefrontDevBadge'
import { HOME_REGISTRY } from '@/components/storefront/themes/registry.generated'
import DynamicPage from '@views/storefront/DynamicPage'
import HomePage from '@views/storefront/HomePage'
import type { Metadata } from 'next'

export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const { site_name } = await getSiteConfig(locale)
  return { title: site_name ? `${site_name}` : 'Home' }
}

async function getPageData(slug: string, locale: string) {
  try {
    const apiUrl = getApiBaseUrl()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(`${apiUrl}/api/v1/web/pages/${slug}/rendered/?lang=${locale}`, {
      cache: 'no-store',
      headers: getApiHeaders(),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Failed to fetch page data:', error)
    return null
  }
}

export default async function Page() {
  const locale = await getLocale()
  const config = await getStorefrontConfigForServer(locale)
  const theme = config.theme ?? 'store'
  const pageData = await getPageData('home', locale)

  const extensions = await loadExtensions()
  const replacements = getPageSectionReplacements(extensions, 'storefront/home')
  const rootReplace = replacements.get('__root__')
  if (rootReplace?.component) {
    const RootComponent = rootReplace.component
    return <RootComponent locale={locale} />
  }

  const ThemeHome = theme ? HOME_REGISTRY[theme] : null
  if (ThemeHome) {
    return <ThemeHome pageData={pageData} locale={locale} />
  }

  const hasNoBlocks = !pageData?.blocks || pageData.blocks.length === 0
  const singleBlock = pageData?.blocks?.length === 1 ? pageData.blocks[0] : null
  const isLegacyWelcomeBlock =
    singleBlock?.type === 'text_block_v1' &&
    (singleBlock.data as { content?: { en?: string } })?.content?.en?.includes('Welcome to')
  const useDefaultHome = hasNoBlocks || isLegacyWelcomeBlock

  const sourceLabel = useDefaultHome ? 'Default HomePage (BFG Store)' : 'CMS Page'
  const wrapper = (children: React.ReactNode) => (
    <div data-home-source={useDefaultHome ? 'default' : 'cms'} data-home-source-label={sourceLabel}>
      {children}
      <StorefrontDevBadge label={sourceLabel} isDefaultHome={useDefaultHome} />
    </div>
  )

  if (useDefaultHome) {
    return wrapper(<HomePage />)
  }
  return wrapper(
    <DynamicPage
      pageData={pageData}
      locale={locale}
      fallback={<HomePage />}
    />
  )
}
