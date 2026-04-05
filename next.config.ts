// @ts-nocheck
import { join } from 'path'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Local: parent root for symlink tracing. Docker: set NEXT_FILE_TRACING_ROOT=/app
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.env.NEXT_FILE_TRACING_ROOT || (process.env.VERCEL ? process.cwd() : join(__dirname, '../..')),
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
  webpack: (config) => {
    // Fallback for --no-turbopack: resolve node_modules from the client directory.
    config.resolve.modules = [join(__dirname, 'node_modules'), 'node_modules']
    return config
  },
}

export default withNextIntl(nextConfig)

