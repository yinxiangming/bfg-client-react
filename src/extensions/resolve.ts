import type { Extension, PageSectionExtension, StorefrontLayoutProps } from './registry'
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
 * Pure function: get replacement sections for a page from extensions.
 * Used by server (SSR home override) and can be shared with usePageSections.
 */
export function getPageSectionReplacements(
  extensions: Extension[],
  page: string
): Map<string, PageSectionExtension> {
  const sections = extensions
    .flatMap((e) => e.sections || [])
    .filter((s) => s.page === page)
    .sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100))

  const replacements = new Map<string, PageSectionExtension>()
  for (const ext of sections) {
    if (ext.condition && !ext.condition()) continue
    if (ext.position === 'replace' && ext.targetSection && !replacements.has(ext.targetSection)) {
      replacements.set(ext.targetSection, ext)
    }
  }
  return replacements
}
