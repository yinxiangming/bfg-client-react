// @ts-nocheck
import fs from 'fs'
import { join } from 'path'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/**
 * Maps public URLs like `/admin/<pluginId>` to the on-disk path `/admin/plugins/<pluginId>/...`
 * produced by scripts/prepare.js when the plugin ships `plugins/<id>/app/admin/<id>/`.
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

/** Single-segment paths we must not steal for plugin short URLs (core storefront / app routes). */
const STOREFRONT_SHORT_PATH_RESERVED = new Set([
  'account',
  'admin',
  'api',
  'auth',
  'cart',
  'category',
  'checkout',
  'product',
  'search',
  'plugins',
  'unknown',
])

/**
 * Storefront plugin pages sync to `app/(storefront)/plugins/<id>/...` (see scripts/prepare.js).
 * Maps `/<route>` → `/plugins/<id>/<route>` when the segment is not reserved (e.g. `/consign`).
 */
function buildStorefrontPluginRewrites() {
  const rules = []
  const pluginsDir = join(__dirname, 'src', 'plugins')
  if (!fs.existsSync(pluginsDir)) return rules

  for (const plugin of fs.readdirSync(pluginsDir)) {
    if (plugin.startsWith('.') || plugin.endsWith('.generated.ts')) continue
    const storefrontDir = join(pluginsDir, plugin, 'app', 'storefront')
    if (!fs.existsSync(storefrontDir)) continue

    for (const ent of fs.readdirSync(storefrontDir, { withFileTypes: true })) {
      if (!ent.isDirectory() || ent.name.startsWith('.')) continue
      const name = ent.name
      const destination =
        name === plugin ? `/plugins/${plugin}` : `/plugins/${plugin}/${name}`

      if (STOREFRONT_SHORT_PATH_RESERVED.has(name)) continue

      rules.push(
        { source: `/${name}`, destination },
        { source: `/${name}/:path*`, destination: `${destination}/:path*` },
      )
    }
  }
  return rules
}

/**
 * `next/image` refuses any remote host that is not allow-listed. Media lives on
 * whatever `NEXT_PUBLIC_MEDIA_URL` points at (an S3/CloudFront CDN in prod and
 * UAT) and falls back to the API origin, so derive the allow-list from those two
 * rather than hard-coding a CDN hostname that changes per environment.
 */
function buildImageRemotePatterns() {
  const seen = new Set<string>()
  const patterns: Array<{ protocol: 'http' | 'https'; hostname: string; pathname: string }> = []

  for (const raw of [process.env.NEXT_PUBLIC_MEDIA_URL, process.env.NEXT_PUBLIC_API_URL]) {
    if (!raw) continue
    let url: URL
    try {
      url = new URL(raw)
    } catch {
      continue // not absolute (e.g. a bare "/media") — nothing remote to allow
    }
    const protocol = url.protocol.replace(':', '')
    if (protocol !== 'http' && protocol !== 'https') continue
    const key = `${protocol}//${url.hostname}`
    if (seen.has(key)) continue
    seen.add(key)
    patterns.push({ protocol, hostname: url.hostname, pathname: '/**' })
  }
  return patterns
}

// Local: parent repo root for symlink tracing. Docker: set NEXT_FILE_TRACING_ROOT=/app.
// On Vercel, omit outputFileTracingRoot (Next 16.2 + monorepo Root Directory can break finalize if this is set).
const tracingRoot =
  process.env.NEXT_FILE_TRACING_ROOT ||
  (process.env.VERCEL ? undefined : join(__dirname, '../..'))

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: buildImageRemotePatterns() },
  ...(process.env.API_PROXY_TARGET ? { skipTrailingSlashRedirect: true } : {}),
  ...(tracingRoot != null && tracingRoot !== '' ? { outputFileTracingRoot: tracingRoot } : {}),
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
  async rewrites() {
    const t = process.env.API_PROXY_TARGET?.replace(/\/+$/, '')
    const px = t ? [
      { source: '/api/v1/:path*/', destination: `${t}/api/v1/:path*/` },
      { source: '/api/v2/:path*/', destination: `${t}/api/v2/:path*/` },
      { source: '/api/v1/:path*', destination: `${t}/api/v1/:path*` },
      { source: '/api/v2/:path*', destination: `${t}/api/v2/:path*` },
      { source: '/media/:path*', destination: `${t}/media/:path*` },
    ] : []
    return { beforeFiles: [...px, ...buildPluginRewrites(), ...buildStorefrontPluginRewrites()] }
  },
  webpack: (config) => {
    // Fallback for --no-turbopack: resolve node_modules from the client directory.
    config.resolve.modules = [join(__dirname, 'node_modules'), 'node_modules']
    return config
  },
}

export default withNextIntl(nextConfig)

