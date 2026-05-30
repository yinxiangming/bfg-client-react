/**
 * Storefront config API: public read-only settings + header/footer menus.
 * GET /api/v1/settings/storefront/
 */

import { cache } from 'react'
import { getApiBaseUrl, getApiHeaders } from './api'
import { getCurrentLocale } from '@/i18n/http'
import {
  DEFAULT_APP_LOCALE,
  normalizeAppLocale,
  uniqueAppLocales,
  type AppLocale,
} from '@/i18n/locales'

export type StorefrontMenuKind = 'link' | 'category' | 'page' | 'post'

export type StorefrontMenuItem = {
  title: string
  url: string
  order: number
  open_in_new_tab: boolean
  /** From API when MenuItem links to CMS; store Header uses for merged nav. */
  kind?: StorefrontMenuKind
  category_slug?: string | null
  page_slug?: string | null
  post_slug?: string | null
}

export type StorefrontFooterMenuGroup = {
  slug?: string
  name: string
  items: StorefrontMenuItem[]
}

export type ColorMode = 'light' | 'dark'

export const ALL_COLOR_MODES: ColorMode[] = ['light', 'dark']

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
  languages?: string[]
  /**
   * Allowed color modes (subset of ['light', 'dark']). When this contains
   * a single entry, the storefront / account / auth UIs force that mode and
   * hide any mode-switcher. Defaults to both when omitted.
   */
  allowed_color_modes?: ColorMode[]
  /**
   * Preferred default color mode. Accepts 'light' | 'dark' | 'system'.
   * 'system' means "follow the OS preference"; only meaningful when more
   * than one entry is in allowed_color_modes.
   */
  default_color_mode?: 'light' | 'dark' | 'system'
  theme?: string
  header?: string
  footer?: string
  header_options?: StorefrontHeaderOptions
  /** When true, new reviews require admin approval before showing. Default false. */
  review_moderation_required?: boolean
  /** Primary domain configured for this workspace (hostname only, no port). */
  workspace_domain?: string
  /** Resolved workspace (public storefront context). */
  workspace_id?: number
  workspace_slug?: string
}

const STALE_MS = 5 * 60 * 1000 // 5 minutes
let cached: { data: StorefrontConfig; at: number } | null = null

export function getStorefrontLanguages(config?: Pick<StorefrontConfig, 'default_language' | 'languages'> | null): AppLocale[] {
  const configured = uniqueAppLocales(config?.languages ?? [])
  const defaultLanguage = normalizeAppLocale(config?.default_language)

  if (configured.length > 0) {
    return configured
  }
  if (defaultLanguage) {
    return [defaultLanguage]
  }
  return [DEFAULT_APP_LOCALE]
}

export function hasMultipleStorefrontLanguages(
  config?: Pick<StorefrontConfig, 'default_language' | 'languages'> | null
): boolean {
  return getStorefrontLanguages(config).length > 1
}

/**
 * Allowed color modes for the current storefront. Defaults to both modes
 * when the config doesn't specify a (non-empty) list — i.e. opt-out, not
 * opt-in. When a single mode is returned, the UI should force it and hide
 * any switcher (mirrors the language-list pattern).
 */
export function getAllowedColorModes(
  config?: Pick<StorefrontConfig, 'allowed_color_modes'> | null
): ColorMode[] {
  const raw = config?.allowed_color_modes
  if (Array.isArray(raw)) {
    const filtered = raw.filter((m): m is ColorMode => m === 'light' || m === 'dark')
    if (filtered.length > 0) return Array.from(new Set(filtered)) as ColorMode[]
  }
  return [...ALL_COLOR_MODES]
}

export function hasMultipleColorModes(
  config?: Pick<StorefrontConfig, 'allowed_color_modes'> | null
): boolean {
  return getAllowedColorModes(config).length > 1
}

/**
 * Resolve the effective color mode given the config + the user's stored
 * preference. When only one mode is allowed, that mode wins regardless of
 * what the user previously chose.
 */
export function resolveColorMode(
  config: Pick<StorefrontConfig, 'allowed_color_modes' | 'default_color_mode'> | null | undefined,
  preferred?: 'light' | 'dark' | 'system' | null
): 'light' | 'dark' | 'system' {
  const allowed = getAllowedColorModes(config)
  if (allowed.length === 1) return allowed[0]
  if (preferred === 'light' || preferred === 'dark') {
    if (allowed.includes(preferred)) return preferred
  }
  if (preferred === 'system') return 'system'
  const def = config?.default_color_mode
  if (def === 'light' || def === 'dark') {
    if (allowed.includes(def)) return def
  }
  return def === 'system' ? 'system' : 'system'
}

export function resolveStorefrontLocale(
  config?: Pick<StorefrontConfig, 'default_language' | 'languages'> | null,
  preferredLocale?: string | null
): AppLocale {
  const languages = getStorefrontLanguages(config)
  const preferred = normalizeAppLocale(preferredLocale)
  const defaultLanguage = normalizeAppLocale(config?.default_language)

  if (languages.length === 1) return languages[0]
  if (preferred && languages.includes(preferred)) return preferred
  if (defaultLanguage && languages.includes(defaultLanguage)) return defaultLanguage
  return languages[0] ?? DEFAULT_APP_LOCALE
}

/** Clear in-memory storefront config cache (e.g. after admin saves general settings). */
export function clearStorefrontConfigCache(): void {
  cached = null
}

/** Align client module cache with SSR payload so other callers of getStorefrontConfig() see menus immediately. */
export function seedStorefrontConfigCache(data: StorefrontConfig): void {
  cached = { data, at: Date.now() }
}

function getStorefrontConfigUrl(locale: string): string {
  const base = getApiBaseUrl()
  const path = `/api/v1/settings/storefront/`
  const params = new URLSearchParams({ lang: locale })
  return `${base}${path}?${params.toString()}`
}

/**
 * Fetch storefront config (sanitized settings + header/footer menus).
 * Uses request host when in browser; workspace id header follows `getWorkspaceId()` when set (same as account/admin).
 * Returns null when server returns 404 or request fails (e.g. not configured yet).
 * Uses in-memory cache for 5 minutes when config is loaded.
 */
export async function getStorefrontConfig(locale?: string): Promise<StorefrontConfig | null> {
  const lang = locale ?? (typeof window !== 'undefined' ? getCurrentLocale() : 'en')
  if (cached && Date.now() - cached.at < STALE_MS) {
    return cached.data
  }
  const requestHost = typeof window !== 'undefined' ? window.location.host : undefined
  const url = getStorefrontConfigUrl(lang)
  const res = await fetch(url, {
    headers: getApiHeaders(
      { 'Content-Type': 'application/json' },
      { requestHost }
    ),
    credentials: 'include',
  })
  if (!res.ok) {
    return null
  }
  const data = (await res.json()) as StorefrontConfig
  if (!data.theme) data.theme = 'store'
  data.default_language = resolveStorefrontLocale(data, data.default_language)
  data.languages = getStorefrontLanguages(data)
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
 * Pass requestHost (e.g. from headers().get('host')); workspace id from env when set (same as other app surfaces).
 * Returns null when server returns 404 (e.g. workspace/site not configured yet).
 * Deduped per request via React.cache() so layout + page share one fetch.
 */
export const getStorefrontConfigForServer = cache(
  async (locale: string, requestHost?: string): Promise<StorefrontConfig | null> => {
    const url = getStorefrontConfigUrl(locale)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(url, {
        headers: getApiHeaders(
          { 'Content-Type': 'application/json' },
          { requestHost }
        ),
        next: { revalidate: 300 },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.status === 404 || !res.ok) {
        return null
      }
      const data = (await res.json()) as StorefrontConfig
      if (!data.theme) data.theme = 'store'
      data.default_language = resolveStorefrontLocale(data, data.default_language)
      data.languages = getStorefrontLanguages(data)
      if (!data.header_options) data.header_options = { ...DEFAULT_HEADER_OPTIONS }
      else data.header_options = { ...DEFAULT_HEADER_OPTIONS, ...data.header_options }
      return data
    } catch {
      clearTimeout(timeoutId)
      return null
    }
  }
)
