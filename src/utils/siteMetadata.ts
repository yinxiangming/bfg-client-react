/**
 * Site metadata for document title: single source for site_name from backend.
 * GET /api/v1/settings/storefront/ (Settings.site_name). Use only getSiteConfig() for title suffix.
 */

import { cache } from 'react'
import { getApiBaseUrl, getApiHeaders } from './api'

const FALLBACK_SITE_NAME = 'Web App'

function getStorefrontConfigUrl(locale: string): string {
  const base = getApiBaseUrl()
  const params = new URLSearchParams({ lang: locale })
  return `${base}/api/v1/settings/storefront/?${params.toString()}`
}

/**
 * Fetch site config (site_name) from storefront API. Deduped per request via React.cache().
 * Use this for generateMetadata / document title only. Fallback: site_name = 'Web App'.
 */
export const getSiteConfig = cache(async (locale?: string): Promise<{ site_name: string }> => {
  const lang = locale ?? 'en'
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)
  try {
    const url = getStorefrontConfigUrl(lang)
    const res = await fetch(url, {
      headers: getApiHeaders({ 'Content-Type': 'application/json' }),
      next: { revalidate: 300 },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return { site_name: FALLBACK_SITE_NAME }
    const data = (await res.json()) as { site_name?: string }
    const site_name = (data?.site_name ?? '').trim() || FALLBACK_SITE_NAME
    return { site_name }
  } catch {
    clearTimeout(timeoutId)
    return { site_name: FALLBACK_SITE_NAME }
  }
})
