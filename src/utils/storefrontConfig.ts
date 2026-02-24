/**
 * Storefront config API: public read-only settings + header/footer menus.
 * GET /api/v1/settings/storefront/
 */

import { cache } from 'react'
import { getApiBaseUrl, getApiHeaders } from './api'
import { getApiLanguageHeaders, getCurrentLocale } from '@/i18n/http'

export type StorefrontMenuItem = {
  title: string
  url: string
  order: number
  open_in_new_tab: boolean
}

export type StorefrontFooterMenuGroup = {
  slug?: string
  name: string
  items: StorefrontMenuItem[]
}

export type StorefrontHeaderOptions = {
  show_search?: boolean
  show_cart?: boolean
  show_language_switcher?: boolean
  show_style_selector?: boolean
  show_login?: boolean
}

const DEFAULT_HEADER_OPTIONS: StorefrontHeaderOptions = {
  show_search: true,
  show_cart: true,
  show_language_switcher: true,
  show_style_selector: true,
  show_login: true,
}

export type StorefrontConfig = {
  site_name: string
  site_description: string
  contact_email: string
  support_email: string
  contact_phone: string
  facebook_url: string
  twitter_url: string
  instagram_url: string
  default_currency: string
  top_bar_announcement: string
  footer_copyright: string
  site_announcement: string
  footer_contact: string
  header_menus: StorefrontMenuItem[]
  footer_menus: StorefrontMenuItem[]
  footer_menu_groups?: StorefrontFooterMenuGroup[]
  default_language?: string
  theme?: string
  header?: string
  footer?: string
  header_options?: StorefrontHeaderOptions
}

const STALE_MS = 5 * 60 * 1000 // 5 minutes
let cached: { data: StorefrontConfig; at: number } | null = null

/** Clear in-memory storefront config cache (e.g. after admin saves general settings). */
export function clearStorefrontConfigCache(): void {
  cached = null
}

function getStorefrontConfigUrl(locale: string): string {
  const base = getApiBaseUrl()
  const path = `/api/v1/settings/storefront/`
  const params = new URLSearchParams({ lang: locale })
  return `${base}${path}?${params.toString()}`
}

/**
 * Fetch storefront config (sanitized settings + header/footer menus).
 * Uses in-memory cache for 5 minutes to avoid repeated requests.
 */
export async function getStorefrontConfig(locale?: string): Promise<StorefrontConfig> {
  const lang = locale ?? (typeof window !== 'undefined' ? getCurrentLocale() : 'en')
  if (cached && Date.now() - cached.at < STALE_MS) {
    return cached.data
  }
  const url = getStorefrontConfigUrl(lang)
  const res = await fetch(url, {
    headers: getApiHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`Storefront config failed: ${res.status}`)
  }
  const data = (await res.json()) as StorefrontConfig
  // Apply defaults for theme and header_options when missing
  if (!data.theme) data.theme = 'store'
  if (!data.header_options) data.header_options = { ...DEFAULT_HEADER_OPTIONS }
  else data.header_options = { ...DEFAULT_HEADER_OPTIONS, ...data.header_options }
  cached = { data, at: Date.now() }
  return data
}

/** Default theme id when not configured (standard store). */
export const DEFAULT_THEME_ID = 'store'

/** Default header options (all true). Used when config is not yet loaded. */
export function getDefaultHeaderOptions(): StorefrontHeaderOptions {
  return { ...DEFAULT_HEADER_OPTIONS }
}

/**
 * Fetch storefront config on server (e.g. in layout or page).
 * Deduped per request via React.cache() so layout + page share one fetch.
 */
export const getStorefrontConfigForServer = cache(async (locale: string): Promise<StorefrontConfig> => {
  const url = getStorefrontConfigUrl(locale)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      headers: getApiHeaders({ 'Content-Type': 'application/json' }),
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      throw new Error(`Storefront config failed: ${res.status}`)
    }
    const data = (await res.json()) as StorefrontConfig
    if (!data.theme) data.theme = 'store'
    if (!data.header_options) data.header_options = { ...DEFAULT_HEADER_OPTIONS }
    else data.header_options = { ...DEFAULT_HEADER_OPTIONS, ...data.header_options }
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
})
