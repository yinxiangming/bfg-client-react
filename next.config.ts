// @ts-nocheck
import fs from 'fs'
import { join } from 'path'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/**
 * Maps public URLs like `/admin/<pluginId>` to the on-disk path `/admin/plugins/<pluginId>/...`
 * produced by scripts/prepare.js when the plugin ships `plugins/<id>/app/admin/<id>/`.
 * Skips `(storefront)` here; storefront plugin routing is handled separately if needed.
 */
function buildPluginRewrites() {
  const rules = []
  const pluginsDir = join(__dirname, 'src', 'plugins')
  if (!fs.existsSync(pluginsDir)) return rules

  for (const plugin of fs.readdirSync(pluginsDir)) {
    if (plugin.startsWith('.') || plugin.endsWith('.generated.ts')) continue
    const pluginApp = join(pluginsDir, plugin, 'app')
    if (!fs.existsSync(pluginApp)) continue

    for (const seg of fs.readdirSync(pluginApp, { withFileTypes: true })) {
      if (!seg.isDirectory() || seg.name.startsWith('.')) continue
      if (seg.name === '(storefront)') continue
      const prefix = `/${seg.name}`
      const segPath = join(pluginApp, seg.name)
      if (!fs.existsSync(join(segPath, plugin))) continue
      rules.push(
        { source: `${prefix}/${plugin}`, destination: `${prefix}/plugins/${plugin}` },
        { source: `${prefix}/${plugin}/:path*`, destination: `${prefix}/plugins/${plugin}/:path*` },
      )
    }
  }
  return rules
}

// Local: parent repo root for symlink tracing. Docker: set NEXT_FILE_TRACING_ROOT=/app.
// On Vercel, omit outputFileTracingRoot (Next 16.2 + monorepo Root Directory can break finalize if this is set).
const tracingRoot =
  process.env.NEXT_FILE_TRACING_ROOT ||
  (process.env.VERCEL ? undefined : join(__dirname, '../..'))

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(tracingRoot != null && tracingRoot !== '' ? { outputFileTracingRoot: tracingRoot } : {}),
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
  async rewrites() {
    return { beforeFiles: buildPluginRewrites() }
  },
  webpack: (config) => {
    // Fallback for --no-turbopack: resolve node_modules from the client directory.
    config.resolve.modules = [join(__dirname, 'node_modules'), 'node_modules']
    return config
  },
}

export default withNextIntl(nextConfig)

