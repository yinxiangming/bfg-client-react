'use client'

import DynamicPage from '@views/storefront/DynamicPage'
import HomePage from '@views/storefront/HomePage'
import StorefrontDevBadge from '@components/storefront/StorefrontDevBadge'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import type { ThemeHomeProps } from '../registry.generated'

/**
 * Does any hero slide already supply the page's <h1>?
 *
 * The hero carousel renders the first slide's title as the H1. When no slides are
 * configured, nothing else on the home page is an H1 — leaving the most-linked page on
 * the site with no heading for search engines to read.
 */
function heroProvidesHeading(blocks: any[]): boolean {
  for (const block of blocks ?? []) {
    if (block?.type === 'hero_carousel_v1') {
      const slides = block?.data?.slides ?? block?.resolvedData ?? []
      if (Array.isArray(slides) && slides.some((s: any) => s?.title)) return true
    }
    const children = block?.data?.children ?? block?.children ?? []
    if (children.length && heroProvidesHeading(children)) return true
  }
  return false
}

export default function StoreHome({
  pageData,
  locale,
  workspace_id: workspaceId,
  workspace_slug: workspaceSlug,
}: ThemeHomeProps) {
  const config = useStorefrontConfigSafe()
  const hasNoBlocks = !pageData?.blocks || pageData.blocks.length === 0
  const singleBlock = pageData?.blocks?.length === 1 ? pageData.blocks[0] : null
  const isLegacyWelcomeBlock =
    singleBlock?.type === 'text_block_v1' &&
    (singleBlock.data as { content?: { en?: string } })?.content?.en?.includes('Welcome to')
  const useDefaultHome = hasNoBlocks || isLegacyWelcomeBlock

  const sourceLabel = useDefaultHome ? 'Default HomePage (BFG Store)' : 'CMS Page'

  // HomePage (the no-CMS fallback) renders its own H1, so only the CMS path needs one.
  const needsHeading = !useDefaultHome && !heroProvidesHeading(pageData?.blocks ?? [])
  const headingText = pageData?.meta_title?.trim() || config?.site_name?.trim() || ''
  const headingSubtext = pageData?.meta_description?.trim() || config?.site_description?.trim() || ''

  return (
    <div data-home-source={useDefaultHome ? 'default' : 'cms'} data-home-source-label={sourceLabel}>
      {needsHeading && headingText && (
        <header className='sf-container sf-home-heading'>
          <h1 className='sf-home-heading-title'>{headingText}</h1>
          {headingSubtext && <p className='sf-home-heading-subtitle'>{headingSubtext}</p>}
        </header>
      )}
      {useDefaultHome ? (
        <HomePage />
      ) : (
        <DynamicPage pageData={pageData} locale={locale} fallback={<HomePage />} />
      )}
      <StorefrontDevBadge
        label={sourceLabel}
        isDefaultHome={useDefaultHome}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
      />
    </div>
  )
}
