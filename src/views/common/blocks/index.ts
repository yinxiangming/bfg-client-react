/**
 * Common block system – types, PageRenderer, PageBuilder.
 * No default registry; callers pass registry getters (storefront, dashboard, etc.).
 */

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

export { PageRenderer } from './PageRenderer'
export { BlockErrorBoundary } from './BlockErrorBoundary'
export { PageBuilder } from './PageBuilder'
