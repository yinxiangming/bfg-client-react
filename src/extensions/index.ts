import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import type { Extension } from './registry'
import { loadPluginExtensions } from './loadExtensionsCore'
export { applyNavExtensions } from './utils/applyNavExtensions'

const EXTENSIONS_CACHE_REVALIDATE_SECONDS = 3600

function getCachedExtensionsForRequest(): Promise<Extension[]> {
  const envKey =
    process.env.ENABLED_PLUGINS || process.env.NEXT_PUBLIC_ENABLED_PLUGINS || ''
  // In development skip cross-request cache so plugin code changes take effect without restart
  if (process.env.NODE_ENV === 'development') {
    return loadPluginExtensions()
  }
  return unstable_cache(
    () => loadPluginExtensions(),
    ['extensions', envKey],
    { revalidate: EXTENSIONS_CACHE_REVALIDATE_SECONDS }
  )()
}

const getCachedServerExtensions = cache(getCachedExtensionsForRequest)

/**
 * Load extensions (works on both server and client).
 * With no args (server): uses request dedup + cross-request cache.
 * With pluginIds (client): loads only those plugins, no cache.
 */
export async function loadExtensions(pluginIds?: string[]): Promise<Extension[]> {
  if (pluginIds !== undefined && pluginIds.length > 0) {
    return loadPluginExtensions(pluginIds)
  }
  return getCachedServerExtensions()
}
