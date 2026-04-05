// @ts-nocheck
import fs from 'fs'
import { join } from 'path'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/**
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

// Local: parent root for symlink tracing. Docker: set NEXT_FILE_TRACING_ROOT=/app
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.env.NEXT_FILE_TRACING_ROOT || (process.env.VERCEL ? process.cwd() : join(__dirname, '../..')),
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

