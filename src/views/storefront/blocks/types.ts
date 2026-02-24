/**
 * Re-export block types from common. Storefront-specific block definitions
 * (library) use BlockDefinition etc. from here.
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
} from '@/views/common/blocks'
