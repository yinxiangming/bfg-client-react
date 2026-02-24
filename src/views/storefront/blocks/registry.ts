/**
 * Block Registry
 *
 * Manually registers block components
 * Each block module exports: definition, Component, and optionally SettingsEditor
 */

import type { BlockDefinition, BlockComponent, BlockSettingsComponent, BlockRegistryEntry } from './types'

// Import block modules manually (Next.js/Turbopack doesn't support import.meta.glob)
import * as HeroCarouselV1Module from './library/hero/HeroCarouselV1/definition'
import * as PostListV1Module from './library/list/PostListV1/definition'
import * as TextBlockV1Module from './library/content/TextBlockV1/definition'
import * as CtaBlockV1Module from './library/content/CtaBlockV1/definition'
import * as ContactFormV1Module from './library/form/ContactFormV1/definition'
import * as CategoryGridV1Module from './library/list/CategoryGridV1/definition'
import * as BannerGridV1Module from './library/media/BannerGridV1/definition'
import * as ProductGridV1Module from './library/list/ProductGridV1/definition'
import * as SectionV1Module from './library/layout/SectionV1/definition'

// All block modules
const blockModules = [
  HeroCarouselV1Module,
  PostListV1Module,
  TextBlockV1Module,
  CtaBlockV1Module,
  ContactFormV1Module,
  CategoryGridV1Module,
  BannerGridV1Module,
  ProductGridV1Module,
  SectionV1Module,
] as const

// Build registry from modules
const registry: Map<string, BlockRegistryEntry> = new Map()
const definitions: BlockDefinition[] = []

for (const module of blockModules) {
  if (module.definition && module.Component) {
    const entry: BlockRegistryEntry = {
      definition: module.definition,
      Component: module.Component as BlockComponent,
      SettingsEditor: module.SettingsEditor,
    }
    registry.set(module.definition.type, entry)
    definitions.push(module.definition)
  }
}

/**
 * Get all registered block definitions
 */
export function getBlockDefinitions(): BlockDefinition[] {
  return definitions
}

/**
 * Get block definitions grouped by category
 */
export function getBlocksByCategory(): Record<string, BlockDefinition[]> {
  const grouped: Record<string, BlockDefinition[]> = {}

  for (const def of definitions) {
    if (!grouped[def.category]) {
      grouped[def.category] = []
    }
    grouped[def.category].push(def)
  }

  return grouped
}

/**
 * Get a block component by type
 */
export function getBlockComponent(type: string): BlockComponent | null {
  const entry = registry.get(type)
  return entry?.Component || null
}

/**
 * Get a block settings editor by type
 */
export function getBlockSettingsEditor(type: string): BlockSettingsComponent | null {
  const entry = registry.get(type)
  return entry?.SettingsEditor || null
}

/**
 * Get a block definition by type
 */
export function getBlockDefinition(type: string): BlockDefinition | null {
  const entry = registry.get(type)
  return entry?.definition || null
}

/**
 * Check if a block type is registered
 */
export function isBlockRegistered(type: string): boolean {
  return registry.has(type)
}

// Export for use in other modules
export { registry as blockRegistry }
