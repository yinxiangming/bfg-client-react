import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import type { Extension } from './registry'
import { PLUGIN_LOADERS } from '@/plugins/loaders'
export { applyNavExtensions } from './utils/applyNavExtensions'

const EXTENSIONS_CACHE_REVALIDATE_SECONDS = 3600

function getEnabledPluginIds(pluginIds?: string[]): string[] {
  if (pluginIds && pluginIds.length > 0) return pluginIds
  const envPlugins =
    process.env.ENABLED_PLUGINS || process.env.NEXT_PUBLIC_ENABLED_PLUGINS
  return envPlugins?.split(',').map((p) => p.trim()).filter(Boolean) || []
}

async function loadExtensionsImpl(pluginIds?: string[]): Promise<Extension[]> {
  const pluginsToLoad = getEnabledPluginIds(pluginIds)
  const extensions: Extension[] = []

  for (const pluginId of pluginsToLoad) {
    const loader = PLUGIN_LOADERS[pluginId]
    if (!loader) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Extensions] Plugin "${pluginId}" not in PLUGIN_LOADERS (src/plugins/loaders.ts)`)
      }
      continue
    }
    try {
      const plugin = await loader()
      const ext = plugin.default as Extension
      if (ext.enabled === false) continue
      if (typeof ext.enabled === 'function' && !ext.enabled()) continue
      extensions.push(ext)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Extensions] Loaded plugin: ${ext.id}`)
      }
    } catch (e) {
      console.warn(`[Extensions] Plugin "${pluginId}" failed to load:`, e)
    }
  }

  const sorted = extensions.sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100))
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Extensions] Loaded ${sorted.length} extension(s)`)
  }
  return sorted
}

function getCachedExtensionsForRequest(): Promise<Extension[]> {
  const envKey =
    process.env.ENABLED_PLUGINS || process.env.NEXT_PUBLIC_ENABLED_PLUGINS || ''
  // In development skip cross-request cache so plugin code changes take effect without restart
  if (process.env.NODE_ENV === 'development') {
    return loadExtensionsImpl()
  }
  return unstable_cache(
    () => loadExtensionsImpl(),
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
    return loadExtensionsImpl(pluginIds)
  }
  return getCachedServerExtensions()
}
