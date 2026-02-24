'use client'

import React from 'react'
import DynamicPage from '@views/storefront/DynamicPage'
import StorefrontDevBadge from '@components/storefront/StorefrontDevBadge'
import type { ThemeHomeProps } from '../registry.generated'

export default function WebsiteHome({ pageData, locale }: ThemeHomeProps) {
  const hasBlocks = pageData?.blocks && pageData.blocks.length > 0

  if (hasBlocks) {
    return (
      <div data-home-source="cms" data-home-source-label="CMS Page">
        <DynamicPage pageData={pageData} locale={locale} />
        <StorefrontDevBadge label="CMS Page" isDefaultHome={false} />
      </div>
    )
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-slate-500 text-sm">
      No home blocks in CMS. Add blocks to the home page to see content.
    </div>
  )
}
