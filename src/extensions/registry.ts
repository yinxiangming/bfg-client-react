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
  /** Called after main entity is saved. Use for plugin-owned related entities. */
  afterSave?: (context: Record<string, any>) => Promise<void>
  transformData?: (data: any) => any
}

export interface OrderHeaderAction {
  id: string
  label: string
  loadingLabel?: string
  i18nKey?: string
  loadingI18nKey?: string
  disabled?: boolean
  run: () => Promise<void>
}

export interface OrderActionContext<OrderType = any> {
  order: OrderType | null
  refreshOrder: () => Promise<void>
}

export interface OrderActionExtension<OrderType = any> {
  id: string
  page: string
  priority?: number
  createAction: (context: OrderActionContext<OrderType>) => OrderHeaderAction | null
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
  /** Optional semver or build label for admin “About / versions”. */
  version?: string
  priority?: number           // global priority, default 100
  enabled?: boolean | (() => boolean)  // when false, disables the whole extension
  nav?: NavExtension[]
  adminNav?: NavExtension[]
  accountNav?: NavExtension[] // Account sidebar menu (e.g. My Listing)
  /** Page slot extensions (before/after/replace/hide). Prefer targetSlot; targetSection is legacy. */
  sections?: PageSlotExtension[]
  dataHooks?: DataHookExtension[]
  /** Action menu entries contributed to entity screens such as admin order edit. */
  orderActions?: OrderActionExtension[]
  /** Dashboard blocks for admin /admin/dashboard */
  dashboardBlocks?: BlockRegistryEntry[]
  /** Replaces default storefront layout (header + main + footer) for all storefront routes. children = page content (home, category, cart, etc.). */
  storefrontLayout?: ComponentType<StorefrontLayoutProps>
}
