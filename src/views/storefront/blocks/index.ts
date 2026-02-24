/**
 * Storefront blocks: common block system + storefront block registry & library.
 * For generic types/components use @/views/common/blocks; for storefront registry use this module.
 */

// Types (from common, re-exported for backward compatibility)
export type {
  BlockCategory,
  BlockDefinition,
  BlockConfig,
  BlockProps,
  BlockSettingsProps,
  BlockComponent,
  BlockSettingsComponent,
  BlockRegistryEntry,
  FieldSchema,
} from './types'

// Generic components (from common) – use with getBlockComponent from this registry for storefront
export { PageRenderer, BlockErrorBoundary, PageBuilder } from '@/views/common/blocks'

// Storefront registry
export {
  getBlockDefinitions,
  getBlocksByCategory,
  getBlockComponent,
  getBlockSettingsEditor,
  getBlockDefinition,
  isBlockRegistered,
} from './registry'

export { BlockRenderContext } from './BlockRenderContext'
