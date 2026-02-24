import type { Extension } from '@/extensions/registry'

/**
 * Static plugin loaders so Next.js can resolve modules at build time.
 * Add entries here when you add a plugin under src/plugins/<id>/index.ts
 * e.g. resale: () => import('@/plugins/resale'),
 */
export const PLUGIN_LOADERS: Record<
  string,
  () => Promise<{ default: Extension }>
> = {
  // Example: freight: () => import('@/plugins/freight'),
}
