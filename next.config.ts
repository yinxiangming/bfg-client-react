// @ts-nocheck
import fs from 'fs'
import { join } from 'path'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** Generated from validated routes by prepare. */
function buildPluginRewrites() {
  const filename = join(__dirname, 'src', '.plugin-route-rewrites.json')
  return fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : []
}

/** Validated during prepare; plugin assets remain under ignored public/plugins/<id>. */
function buildPluginPublicRewrites() {
  const filename = join(__dirname, 'src', '.plugin-public-mounts.json')
  return fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : []
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
  ...(process.env.NEXT_STANDALONE === 'true' ? { output: 'standalone' } : {}),
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
    return { beforeFiles: [...px, ...buildPluginRewrites()], afterFiles: buildPluginPublicRewrites() }
  },
  webpack: (config) => {
    // Fallback for --no-turbopack: resolve node_modules from the client directory.
    config.resolve.modules = [join(__dirname, 'node_modules'), 'node_modules']
    return config
  },
}

export default withNextIntl(nextConfig)

