'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  blockId: string
  blockType: string
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary for individual blocks.
 * Prevents a single broken block from crashing the entire page.
 */
export class BlockErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Block error [${this.props.blockType}/${this.props.blockId}]:`, error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div
          style={{
            padding: '1rem',
            margin: '0.5rem 0',
            backgroundColor: 'var(--block-bg-secondary, #f8f9fa)',
            borderRadius: '8px',
            border: '1px solid var(--block-border-color, #dee2e6)',
          }}
        >
          <p style={{ margin: 0, color: 'var(--block-text-muted, #6c757d)' }}>
            Failed to render block: {this.props.blockType}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre
              style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#dc3545',
                whiteSpace: 'pre-wrap',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
