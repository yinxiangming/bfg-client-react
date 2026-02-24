'use client'

import React from 'react'
import type { BlockComponent } from '@/views/common/blocks'

/** Used by layout blocks (e.g. section_v1) to render nested blocks without circular dependency */
export const BlockRenderContext = React.createContext<
  ((type: string) => BlockComponent | null) | null
>(null)
