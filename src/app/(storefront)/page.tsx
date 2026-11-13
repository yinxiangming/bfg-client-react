import { getEffectiveTheme } from '@/extensions/skinAvailability'
import React from 'react'
import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { loadExtensions } from '@/extensions'
import { filterEnabledExtensions } from '@/extensions/availability'
import { getPageSlotReplacements } from '@/extensions/resolve'
import { ROOT_SLOT_ID } from '@/extensions/terminology'
import { getSiteConfig } from '@/utils/siteMetadata'
import {
  getRequestOrigin,
  clampDescription,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  jsonLdScript,
  localeTag,
  openGraphLocale,
} from '@/utils/seo'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { fetchRenderedCmsPage } from '@/services/storefrontCmsApi'
import { resolveCmsBlocks } from '@/utils/resolveCmsBlocks'
import StorefrontDevBadge from '@components/storefront/StorefrontDevBadge'
import { HOME_REGISTRY, THEME_METADATA } from '@/components/storefront/themes/registry.generated'
import { resolveStorefrontPage } from '@/components/storefront/themes/resolve'
import DynamicPage from '@views/storefront/DynamicPage'
import HomePage from '@views/storefront/HomePage'
import type { Metadata } from 'next'
import { getStorefrontServerProvider } from '@/extensions/storefrontServer'

// The API owns the rendered CMS cache and invalidates it after editorial writes.
// Do not keep a second stale copy of content in the Next data cache.
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
  const provider = await getStorefrontServerProvider(config)
  // The CMS home page carries hand-written meta fields; they are the most specific source
  // and were previously ignored in favour of the generic site description.
  const description =
    clampDescription(pageData?.meta_description) || clampDescription(config?.site_description)
  // A bare site name ranks for nothing, so a store should set the CMS page's meta_title to
  // something that says what it sells. Only that field can know — this file cannot invent it.
  const title = pageData?.meta_title?.trim() || siteName
  const images = provider?.homeImages?.({ config, locale, requestHost, origin, pageData })

  return {
    // `absolute` opts out of the root '%s | siteName' template so the homepage title
    // is not '<site name> | <site name>'.
    title: { absolute: title },
    description,
    alternates: { canonical: origin || '/' },
    openGraph: {
      title,
      description,
      type: 'website',
      url: origin || undefined,
      siteName,
      // A page-level openGraph replaces the root's wholesale, so locale is repeated here.
      locale: openGraphLocale(locale, config?.country),
      images,
    },
    twitter: { card: 'summary_large_image', title, description, images: images?.map(image => image.url) },
  }
}

async function getPageData(slug: string, locale: string, requestHost?: string, languages?: string[]) {
  // The backend cache is shared by all clients and invalidated on commit.
  return fetchRenderedCmsPage(slug, locale, requestHost, { cache: 'no-store', languages })
}

/**
 * Organization + WebSite graph. This is the entity block search and generative engines read to
 * answer "who is this store" — emitted once, on the homepage, and referenced by @id elsewhere.
 */
async function SiteJsonLd({
  origin,
  config,
  locale,
}: {
  origin: string
  config: any
  locale: string
}) {
  const siteName = config?.site_name?.trim()
  // No origin means no absolute @id, and no site name means no entity worth describing.
  if (!origin || !siteName) return null
  const description = clampDescription(config?.site_description, 5000) || undefined
  const provider = await getStorefrontServerProvider(config)
  const graph = [
    provider?.organizationJsonLd?.({ config, locale, origin }) || buildOrganizationJsonLd(origin, {
      siteName,
      description,
      email: config?.contact_email || undefined,
      phone: config?.contact_phone || undefined,
      socials: [config?.facebook_url, config?.twitter_url, config?.instagram_url],
      country: config?.country,
      currency: config?.default_currency,
    }),
    buildWebSiteJsonLd(origin, siteName, description, localeTag(locale, config?.country)),
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
  const theme = getEffectiveTheme(config.theme, THEME_METADATA, config)
  const rawPageData = await getPageData('home', locale, requestHost, config.languages)
  // Fill in product/category grids before render so they appear in the SSR HTML.
  const pageData = await resolveCmsBlocks(rawPageData, requestHost, locale)

  const extensions = filterEnabledExtensions(await loadExtensions(), config.extensions)
  const replacements = getPageSlotReplacements(extensions, 'storefront/home')
  const rootReplace = replacements.get(ROOT_SLOT_ID)
  const siteJsonLd = <SiteJsonLd origin={origin} config={config} locale={locale} />

  if (rootReplace?.component) {
    const RootComponent = rootReplace.component
    return (
      <>
        {siteJsonLd}
        <RootComponent locale={locale} />
      </>
    )
  }

  // Skin-level page override (themes/<id>/pages/home.tsx) takes priority over
  // the legacy HOME_REGISTRY (themes/<id>/Home.tsx).
  const SkinHome = await resolveStorefrontPage('home')
  if (SkinHome) {
    return (
      <>
        {siteJsonLd}
        <SkinHome
          pageData={pageData}
          locale={locale}
          workspace_id={config.workspace_id}
          workspace_slug={config.workspace_slug}
        />
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
