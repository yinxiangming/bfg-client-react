import React from 'react'
import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { loadExtensions } from '@/extensions'
import { getPageSlotReplacements } from '@/extensions/resolve'
import { ROOT_SLOT_ID } from '@/extensions/terminology'
import { getSiteConfig } from '@/utils/siteMetadata'
import {
  getRequestOrigin,
  clampDescription,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  jsonLdScript,
} from '@/utils/seo'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { fetchRenderedCmsPage } from '@/services/storefrontCmsApi'
import { resolveCmsBlocks } from '@/utils/resolveCmsBlocks'
import StorefrontDevBadge from '@components/storefront/StorefrontDevBadge'
import { HOME_REGISTRY } from '@/components/storefront/themes/registry.generated'
import DynamicPage from '@views/storefront/DynamicPage'
import HomePage from '@views/storefront/HomePage'
import type { Metadata } from 'next'

// 60s ISR instead of fully dynamic: the homepage was re-rendering on every request
// (TTFB ~1.5s), which hurts Core Web Vitals and burns crawl budget. CMS edits go live
// within a minute. Set back to 0 if instant preview of CMS edits matters more.
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const [config, origin, pageData] = await Promise.all([
    getStorefrontConfigForServer(locale, requestHost).catch(() => null),
    getRequestOrigin(),
    getPageData('home', locale, requestHost).catch(() => null),
  ])

  const siteName = config?.site_name?.trim() || 'Home'
  // The CMS home page carries hand-written meta fields; they are the most specific source
  // and were previously ignored in favour of the generic site description.
  const description =
    clampDescription(pageData?.meta_description) || clampDescription(config?.site_description)
  // A bare site name ranks for nothing. Lead with what the store sells and where it ships,
  // which is also the sentence generative engines quote when asked for NZ suppliers.
  const title =
    pageData?.meta_title?.trim() ||
    (description ? `${siteName} – Arduino, Raspberry Pi & Electronics NZ` : siteName)

  return {
    // `absolute` opts out of the root '%s | siteName' template so the homepage title
    // is not 'GeekStudio | GeekStudio'.
    title: { absolute: title },
    description,
    alternates: { canonical: origin || '/' },
    openGraph: {
      title,
      description,
      type: 'website',
      url: origin || undefined,
      siteName,
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

async function getPageData(slug: string, locale: string, requestHost?: string) {
  // `cache: 'no-store'` opted the route out of the 60s ISR declared above, so the homepage
  // re-rendered on every request. Match the route's revalidate window instead.
  return fetchRenderedCmsPage(slug, locale, requestHost, { revalidate: 60 })
}

/**
 * Organization + WebSite graph. This is the entity block search and generative engines read to
 * answer "who is GeekStudio" — it is emitted once, on the homepage, and referenced by @id
 * elsewhere.
 */
function SiteJsonLd({ origin, config }: { origin: string; config: any }) {
  if (!origin) return null
  const siteName = config?.site_name?.trim() || 'GeekStudio'
  const description = clampDescription(config?.site_description, 5000) || undefined
  const graph = [
    buildOrganizationJsonLd(origin, {
      siteName,
      description,
      email: config?.contact_email || undefined,
      phone: config?.contact_phone || undefined,
      socials: [config?.facebook_url, config?.twitter_url, config?.instagram_url],
    }),
    buildWebSiteJsonLd(origin, siteName, description),
  ]
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }}
    />
  )
}

export default async function Page() {
  const locale = await getLocale()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  if (config === null) return null
  const origin = await getRequestOrigin()
  const theme = config.theme ?? 'store'
  const rawPageData = await getPageData('home', locale, requestHost)
  // Fill in product/category grids before render so they appear in the SSR HTML.
  const pageData = await resolveCmsBlocks(rawPageData, requestHost, locale)

  const extensions = await loadExtensions()
  const replacements = getPageSlotReplacements(extensions, 'storefront/home')
  const rootReplace = replacements.get(ROOT_SLOT_ID)
  const siteJsonLd = <SiteJsonLd origin={origin} config={config} />

  if (rootReplace?.component) {
    const RootComponent = rootReplace.component
    return (
      <>
        {siteJsonLd}
        <RootComponent locale={locale} />
      </>
    )
  }

  const ThemeHome = theme ? HOME_REGISTRY[theme] : null
  if (ThemeHome) {
    return (
      <>
        {siteJsonLd}
        <ThemeHome
          pageData={pageData}
          locale={locale}
          workspace_id={config.workspace_id}
          workspace_slug={config.workspace_slug}
        />
      </>
    )
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
      {siteJsonLd}
      {children}
      <StorefrontDevBadge
        label={sourceLabel}
        isDefaultHome={useDefaultHome}
        workspaceId={config.workspace_id}
        workspaceSlug={config.workspace_slug}
      />
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
