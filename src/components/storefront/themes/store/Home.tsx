'use client'

import DynamicPage from '@views/storefront/DynamicPage'
import HomePage from '@views/storefront/HomePage'
import StorefrontDevBadge from '@components/storefront/StorefrontDevBadge'
import type { ThemeHomeProps } from '../registry.generated'

export default function StoreHome({ pageData, locale }: ThemeHomeProps) {
  const hasNoBlocks = !pageData?.blocks || pageData.blocks.length === 0
  const singleBlock = pageData?.blocks?.length === 1 ? pageData.blocks[0] : null
  const isLegacyWelcomeBlock =
    singleBlock?.type === 'text_block_v1' &&
    (singleBlock.data as { content?: { en?: string } })?.content?.en?.includes('Welcome to')
  const useDefaultHome = hasNoBlocks || isLegacyWelcomeBlock

  const sourceLabel = useDefaultHome ? 'Default HomePage (BFG Store)' : 'CMS Page'

  return (
    <div data-home-source={useDefaultHome ? 'default' : 'cms'} data-home-source-label={sourceLabel}>
      {useDefaultHome ? (
        <HomePage />
      ) : (
        <DynamicPage pageData={pageData} locale={locale} fallback={<HomePage />} />
      )}
      <StorefrontDevBadge label={sourceLabel} isDefaultHome={useDefaultHome} />
    </div>
  )
}
