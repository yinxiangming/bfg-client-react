import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import type { AppLocale } from './routing'

export type PluginMessages = Record<string, unknown>

/** Deep merge source into target (mutates target). */
function deepMerge(target: PluginMessages, source: PluginMessages): PluginMessages {
  for (const key of Object.keys(source)) {
    const src = source[key]
    if (src != null && typeof src === 'object' && !Array.isArray(src)) {
      if (!target[key] || typeof target[key] !== 'object') (target as Record<string, unknown>)[key] = {}
      deepMerge((target as Record<string, unknown>)[key] as PluginMessages, src as PluginMessages)
    } else {
      (target as Record<string, unknown>)[key] = src
    }
  }
  return target
}

/** Resolve plugins dir: prefer path relative to this module so it works regardless of cwd. */
function getPluginsDir(): string {
  const fromCwd = path.join(process.cwd(), 'src', 'plugins')
  try {
    const dir = typeof __dirname !== 'undefined'
      ? __dirname
      : path.dirname(fileURLToPath(import.meta.url))
    const fromModule = path.join(dir, '..', 'plugins')
    if (fs.existsSync(fromModule)) return fromModule
  } catch {
    // ESM/__dirname not available
  }
  return fromCwd
}

/**
 * Scan plugins dir for subdirs that have messages/{locale}.json, load and merge.
 * Return shape: { account?, admin?, [pluginId]? } for merge into app messages.
 */
export async function loadPluginMessages(
  locale: AppLocale
): Promise<PluginMessages | null> {
  const pluginsDir = getPluginsDir()
  let dirs: string[]
  try {
    dirs = fs.readdirSync(pluginsDir, { withFileTypes: true })
      .filter((d) => {
        if (d.isDirectory()) return true
        // Symlinks: treat as dir if target is a directory
        if (d.isSymbolicLink?.()) {
          try {
            return fs.statSync(path.join(pluginsDir, d.name)).isDirectory()
          } catch {
            return false
          }
        }
        return false
      })
      .map((d) => d.name)
  } catch {
    return null
  }

  const merged: PluginMessages = { admin: {}, account: {} }
  let hasAny = false

  for (const pluginId of dirs) {
    const filePath = path.join(pluginsDir, pluginId, 'messages', `${locale}.json`)
    try {
      if (!fs.existsSync(filePath)) continue
      const raw = fs.readFileSync(filePath, 'utf-8')
      const content = JSON.parse(raw) as PluginMessages
      if (!content || typeof content !== 'object') continue
      hasAny = true
      if (content.admin) deepMerge(merged.admin as PluginMessages, content.admin as PluginMessages)
      if (content.account) deepMerge(merged.account as PluginMessages, content.account as PluginMessages)
      const ns = content[pluginId]
      if (ns != null && typeof ns === 'object') (merged as Record<string, unknown>)[pluginId] = ns
    } catch {
      // invalid or missing messages, skip
    }
  }

  return hasAny ? merged : null
}
