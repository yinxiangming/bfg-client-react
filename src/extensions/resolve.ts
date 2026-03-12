import type { Extension, PageSlotExtension, StorefrontLayoutProps } from './registry'
import { getTargetSlot } from './registry'
import type { ComponentType } from 'react'

/**
 * Returns the first (highest priority) extension's storefront layout component, if any.
 * When present, (storefront)/layout uses it for all storefront routes; children = page content.
 */
export function getStorefrontLayoutOverride(
  extensions: Extension[]
): ComponentType<StorefrontLayoutProps> | null {
  const sorted = [...extensions].sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100))
  for (const ext of sorted) {
    if (ext.storefrontLayout) return ext.storefrontLayout
  }
  return null
}

/**
 * Pure function: get replacement slots for a page from extensions.
 * Used by server (SSR home override) and usePageSlots.
 */
export function getPageSlotReplacements(
  extensions: Extension[],
  page: string
): Map<string, PageSlotExtension> {
  const slots = extensions
    .flatMap((e) => e.sections || [])
    .filter((s) => s.page === page)
    .sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100))

  const replacements = new Map<string, PageSlotExtension>()
  for (const ext of slots) {
    if (ext.condition && !ext.condition()) continue
    const slotId = getTargetSlot(ext)
    if (ext.position === 'replace' && slotId && !replacements.has(slotId)) {
      replacements.set(slotId, ext)
    }
  }
  return replacements
}

/** @deprecated Use getPageSlotReplacements */
export function getPageSectionReplacements(
  extensions: Extension[],
  page: string
): Map<string, PageSlotExtension> {
  return getPageSlotReplacements(extensions, page)
}
