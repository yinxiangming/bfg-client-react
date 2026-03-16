import type { MenuNode } from '@/types/menu'
import type { ComponentType, ReactNode } from 'react'
import type { BlockRegistryEntry } from '@/views/common/blocks'

// Position types - hide hides the existing item
export type ExtensionPosition = 'before' | 'after' | 'replace' | 'hide'

// Nav extension
export interface NavExtension {
  id: string
  position: ExtensionPosition
  targetId?: string           // target ID for hide/replace/before/after
  items?: MenuNode[]          // required for before/after/replace
  priority?: number           // overrides Extension-level priority
  condition?: () => boolean   // optional: runtime condition
}

// Page slot extension (canonical). Slot = where to mount content on a page.
export interface PageSlotExtension {
  id: string
  page: string
  position: ExtensionPosition
  targetSlot?: string
  /** @deprecated Use targetSlot */
  targetSection?: string
  component?: ComponentType<any>
  priority?: number
  condition?: () => boolean
}

/** @deprecated Use PageSlotExtension and targetSlot */
export type PageSectionExtension = PageSlotExtension

// Data hook extension
export interface DataHookExtension {
  id: string
  page: string
  priority?: number
  onLoad?: (data: any) => Promise<any>
  onSave?: (data: any) => Promise<any>
  /** Called after main entity is saved (e.g. after product update). Use for related entities like ResaleProduct. */
  afterSave?: (context: Record<string, any>) => Promise<void>
  transformData?: (data: any) => any
}

/** Props for plugin-provided storefront layout (replaces default StorefrontLayout). */
export interface StorefrontLayoutProps {
  children: ReactNode
  locale?: string
}

/** Resolve effective target slot from extension (supports legacy targetSection). */
export function getTargetSlot(ext: PageSlotExtension): string | undefined {
  return ext.targetSlot ?? ext.targetSection
}

// Main extension interface
export interface Extension {
  id: string
  name: string
  priority?: number           // global priority, default 100
  enabled?: boolean | (() => boolean)  // when false, disables the whole extension
  nav?: NavExtension[]
  adminNav?: NavExtension[]
  accountNav?: NavExtension[] // Account sidebar menu (e.g. My Listing)
  /** Page slot extensions (before/after/replace/hide). Prefer targetSlot; targetSection is legacy. */
  sections?: PageSlotExtension[]
  dataHooks?: DataHookExtension[]
  /** Dashboard blocks for admin /admin/dashboard */
  dashboardBlocks?: BlockRegistryEntry[]
  /** Replaces default storefront layout (header + main + footer) for all storefront routes. children = page content (home, category, cart, etc.). */
  storefrontLayout?: ComponentType<StorefrontLayoutProps>
}
