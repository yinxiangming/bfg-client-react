import { cache } from 'react'
import type { Extension } from './registry'
import { loadPluginExtensions } from './loadExtensionsCore'
export { applyNavExtensions } from './utils/applyNavExtensions'

// Extensions hold components and functions, so they must not go through
// unstable_cache: Next stores its result as JSON and drops both on a cache hit.
// Plugin modules are cached by the module loader after the first import, so
// deduplicating per request is enough.
const getServerExtensions = cache(() => loadPluginExtensions())

/**
 * Load extensions (works on both server and client).
 * With no args (server): deduplicated per request.
 * With pluginIds (client): loads only those plugins.
 */
export async function loadExtensions(pluginIds?: string[]): Promise<Extension[]> {
  if (pluginIds !== undefined && pluginIds.length > 0) {
    return loadPluginExtensions(pluginIds)
  }
  return getServerExtensions()
}
