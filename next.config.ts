// @ts-nocheck
import { join } from 'path'
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Local: parent root for symlink tracing. Docker: set NEXT_FILE_TRACING_ROOT=/app
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.env.NEXT_FILE_TRACING_ROOT || join(__dirname, '../..'),
}

export default withNextIntl(nextConfig)

