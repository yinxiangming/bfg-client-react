'use client'

import React, { useContext } from 'react'
import { PageRenderer } from '@/views/common/blocks'
import type { BlockConfig } from '@/views/common/blocks'
import { BlockRenderContext } from '../../../BlockRenderContext'

interface SectionV1Data {
  width?: 'container' | 'full'
  children?: BlockConfig[]
}

interface SectionV1Props {
  block: { id: string; type: string; data?: SectionV1Data }
  settings: Record<string, unknown>
  data: SectionV1Data
  locale?: string
  isEditing?: boolean
}

/**
 * Layout block: wraps child blocks in sf-container (fixed max-width) or full width.
 */
export default function SectionV1({ data, locale = 'en', isEditing }: SectionV1Props) {
  const getBlockComponent = useContext(BlockRenderContext)
  const children = (data?.children || []) as BlockConfig[]
  const width = data?.width === 'full' ? 'full' : 'container'

  if (!getBlockComponent || !children.length) {
    if (isEditing && !children.length) {
      return (
        <div className='section-v1-empty' style={{ padding: '1rem', background: '#f5f5f5', borderRadius: 8 }}>
          <span style={{ color: '#888', fontSize: 14 }}>Section (add blocks in editor)</span>
        </div>
      )
    }
    return null
  }

  const content = (
    <PageRenderer
      blocks={children}
      locale={locale}
      isEditing={isEditing}
      getBlockComponent={getBlockComponent}
    />
  )

  return width === 'container' ? (
    <div className='sf-container section-v1-container' style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
      {content}
    </div>
  ) : (
    <div className='section-v1-full' style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
      {content}
    </div>
  )
}
