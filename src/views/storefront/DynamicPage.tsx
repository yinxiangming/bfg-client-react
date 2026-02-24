'use client'

import React from 'react'
import { PageRenderer, getBlockComponent, BlockRenderContext } from './blocks'
import type { BlockConfig } from './blocks'

// Import block CSS variables
import './blocks/styles/block-variables.css'

interface PageData {
  id: number
  title: string
  slug: string
  blocks: BlockConfig[]
  meta_title?: string
  meta_description?: string
  language?: string
}

interface DynamicPageProps {
  /** Page data from API */
  pageData: PageData | null

  /** Current locale */
  locale?: string

  /** Fallback content when no blocks configured */
  fallback?: React.ReactNode

  /** Whether in edit mode */
  isEditing?: boolean

  /** Callback when a block is clicked in edit mode */
  onBlockClick?: (blockId: string) => void
}

/**
 * Dynamic page component that renders blocks from page configuration
 * Falls back to provided content if no blocks are configured
 */
export function DynamicPage({
  pageData,
  locale = 'en',
  fallback,
  isEditing = false,
  onBlockClick,
}: DynamicPageProps) {
  // If no page data or no blocks, render fallback
  if (!pageData || !pageData.blocks || pageData.blocks.length === 0) {
    if (fallback) {
      return <>{fallback}</>
    }
    return null
  }

  return (
    <div className='dynamic-page'>
      <BlockRenderContext.Provider value={getBlockComponent}>
        <PageRenderer
          blocks={pageData.blocks}
          locale={locale}
          isEditing={isEditing}
          onBlockClick={onBlockClick}
          getBlockComponent={getBlockComponent}
        />
      </BlockRenderContext.Provider>
    </div>
  )
}

export default DynamicPage
