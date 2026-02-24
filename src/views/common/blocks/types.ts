/**
 * Block system types – shared by storefront, admin dashboard, and other block-based UIs.
 */

import type { ComponentType } from 'react'

/** Known categories + string so plugins can use any category (e.g. 'resale') without adding to common */
export type BlockCategory =
  | 'hero'
  | 'content'
  | 'list'
  | 'form'
  | 'layout'
  | 'media'
  | 'product'
  | 'store'
  | 'system'
  | string

export interface BlockDefinition {
  type: string
  name: string
  category: BlockCategory
  thumbnail?: string
  description?: string
  settingsSchema?: Record<string, FieldSchema>
  dataSchema?: Record<string, FieldSchema>
  defaultSettings?: Record<string, unknown>
  defaultData?: Record<string, unknown>
}

export interface FieldSchema {
  type: 'string' | 'integer' | 'boolean' | 'array' | 'object' | 'select' | 'image' | 'text'
  required?: boolean
  default?: unknown
  description?: string
  label?: string
  label_zh?: string
  options?: Array<{ label: string; value: string }>
}

export interface BlockConfig {
  id: string
  type: string
  settings?: Record<string, unknown>
  data?: Record<string, unknown>
  resolvedData?: unknown
}

export interface BlockProps<S = Record<string, unknown>, D = Record<string, unknown>> {
  block: BlockConfig
  settings: S
  data: D
  resolvedData?: unknown
  locale?: string
  isEditing?: boolean
}

export interface BlockSettingsProps<S = Record<string, unknown>, D = Record<string, unknown>> {
  block: BlockConfig
  settings: S
  data: D
  onSettingsChange: (settings: S) => void
  onDataChange: (data: D) => void
  locale?: string
}

export type BlockComponent<S = Record<string, unknown>, D = Record<string, unknown>> = ComponentType<
  BlockProps<S, D>
>

export type BlockSettingsComponent<S = Record<string, unknown>, D = Record<string, unknown>> =
  ComponentType<BlockSettingsProps<S, D>>

export interface BlockRegistryEntry {
  definition: BlockDefinition
  Component: BlockComponent
  SettingsEditor?: BlockSettingsComponent
}
