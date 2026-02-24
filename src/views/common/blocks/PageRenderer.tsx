'use client'

import React from 'react'
import { BlockConfig } from './types'
import { BlockErrorBoundary } from './BlockErrorBoundary'
import type { BlockComponent } from './types'

interface PageRendererProps {
  blocks: BlockConfig[]
  locale?: string
  isEditing?: boolean
  onBlockClick?: (blockId: string) => void
  className?: string
  /** Resolver for block component by type (required – no default registry) */
  getBlockComponent: (type: string) => BlockComponent | null
}

/**
 * Renders a page from block configurations.
 * Each block is wrapped in an error boundary.
 * Caller must provide getBlockComponent (e.g. from a block registry).
 */
export function PageRenderer({
  blocks,
  locale = 'en',
  isEditing = false,
  onBlockClick,
  className,
  getBlockComponent,
}: PageRendererProps) {
  if (!blocks || blocks.length === 0) {
    if (isEditing) {
      return (
        <div className='page-renderer-empty' style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--block-text-muted, #6c757d)' }}>No blocks added yet</p>
          <p style={{ color: 'var(--block-text-muted, #6c757d)', fontSize: '0.875rem' }}>
            Click the + button to add your first block
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className={`page-renderer ${className || ''}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {blocks.map((block) => (
        <BlockWrapper
          key={block.id}
          block={block}
          locale={locale}
          isEditing={isEditing}
          onClick={onBlockClick ? () => onBlockClick(block.id) : undefined}
          getBlockComponent={getBlockComponent}
        />
      ))}
    </div>
  )
}

interface BlockWrapperProps {
  block: BlockConfig
  locale: string
  isEditing: boolean
  onClick?: () => void
  getBlockComponent: (type: string) => BlockComponent | null
}

function BlockWrapper({ block, locale, isEditing, onClick, getBlockComponent }: BlockWrapperProps) {
  const Component = getBlockComponent(block.type)

  if (!Component) {
    if (isEditing) {
      return (
        <div
          className='block-wrapper block-unknown'
          onClick={onClick}
          style={{
            padding: '1rem',
            margin: '0.5rem 0',
            backgroundColor: 'var(--block-bg-secondary, #f8f9fa)',
            borderRadius: '8px',
            border: '2px dashed var(--block-border-color, #dee2e6)',
            cursor: 'pointer',
          }}
        >
          <p style={{ margin: 0, color: 'var(--block-text-muted, #6c757d)' }}>
            Unknown block type: {block.type}
          </p>
        </div>
      )
    }
    return null
  }

  const wrapperStyle: React.CSSProperties = isEditing
    ? { cursor: 'pointer', position: 'relative' }
    : {}

  return (
    <BlockErrorBoundary blockId={block.id} blockType={block.type}>
      <div
        className={`block-wrapper block-${block.type}`}
        onClick={onClick}
        style={wrapperStyle}
        data-block-id={block.id}
        data-block-type={block.type}
      >
        <Component
          block={block}
          settings={block.settings || {}}
          data={block.data || {}}
          resolvedData={block.resolvedData}
          locale={locale}
          isEditing={isEditing}
        />
      </div>
    </BlockErrorBoundary>
  )
}

export default PageRenderer
