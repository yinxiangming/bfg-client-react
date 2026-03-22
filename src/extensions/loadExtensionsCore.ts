import type { Extension } from './registry'
import { PLUGIN_LOADERS } from '@/plugins/loaders.generated'

function getEnabledPluginIds(pluginIds?: string[]): string[] {
  if (pluginIds && pluginIds.length > 0) return pluginIds
  const envPlugins =
    process.env.ENABLED_PLUGINS || process.env.NEXT_PUBLIC_ENABLED_PLUGINS
  return envPlugins?.split(',').map((p) => p.trim()).filter(Boolean) || []
}

/**
 * Load extension modules (no Next.js cache). Safe to import from Client Components.
 * With explicit pluginIds (from server layout): load only those plugins.
 * With no args: load from env (same as server default).
 */
export async function loadPluginExtensions(pluginIds?: string[]): Promise<Extension[]> {
  const pluginsToLoad = getEnabledPluginIds(pluginIds)
  const extensions: Extension[] = []

  for (const pluginId of pluginsToLoad) {
    const loader = PLUGIN_LOADERS[pluginId]
    if (!loader) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Extensions] Plugin "${pluginId}" not in PLUGIN_LOADERS (src/plugins/loaders.generated.ts)`)
      }
      continue
    }
    try {
      const plugin = await loader()
      const ext = plugin.default as Extension
      if (ext.enabled === false) continue
      if (typeof ext.enabled === 'function' && !ext.enabled()) continue
      extensions.push(ext)
    } catch (e) {
      console.warn(`[Extensions] Plugin "${pluginId}" failed to load:`, e)
    }
  }

  return extensions.sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100))
}
