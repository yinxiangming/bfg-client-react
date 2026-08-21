import {cookies, headers} from 'next/headers'
import {getRequestConfig} from 'next-intl/server'
import {routing, type AppLocale} from './routing'
import {loadPluginMessages} from './plugin-messages'
import {DEFAULT_APP_LOCALE, normalizeAppLocale, uniqueAppLocales} from './locales'

type Messages = Record<string, any>

const enabledApps = ['storefront', 'account', 'admin', 'auth'] as const
type EnabledApp = (typeof enabledApps)[number]

function isSupportedLocale(locale: string): locale is AppLocale {
  return (routing.locales as readonly string[]).includes(locale)
}

function getWorkspaceApiBaseUrl(): string | null {
  const baseUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_WORKSPACE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  return baseUrl ? baseUrl.replace(/\/+$/, '') : null
}

/** Deep merge source into target (mutates target). */
function deepMerge(target: Messages, source: Messages): Messages {
  for (const key of Object.keys(source)) {
    const src = source[key]
    if (src != null && typeof src === 'object' && !Array.isArray(src)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {}
      deepMerge(target[key] as Messages, src as Messages)
    } else {
      target[key] = src
    }
  }
  return target
}

async function loadCommonMessages(locale: AppLocale): Promise<Messages> {
  return (await import(`../messages/common/${locale}.json`)).default
}

async function loadAppMessages(app: EnabledApp, locale: AppLocale): Promise<Messages> {
  return (await import(`../messages/${app}/${locale}.json`)).default
}

async function getLocaleFromCookie(): Promise<AppLocale | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get('NEXT_LOCALE')?.value
  if (value && isSupportedLocale(value)) return value
  return null
}

function getLocaleFromAcceptLanguageHeader(al: string): AppLocale | null {
  // Minimal matching for our supported locales. Order matters: a plain `includes('zh')`
  // check ran first, so `en-NZ,zh;q=0.5` — English preferred, Chinese as a fallback —
  // selected Chinese. Whichever tag appears first in the header wins instead.
  const header = al.toLowerCase()
  const en = header.search(/\ben\b/)
  const zh = header.search(/\bzh\b/)
  if (en !== -1 && (zh === -1 || en <= zh)) return 'en'
  if (zh !== -1) return 'zh-hans'
  return null
}

async function getSingleSiteLocale(headerStore: Awaited<ReturnType<typeof headers>>): Promise<AppLocale | null> {
  const apiBase = getWorkspaceApiBaseUrl()
  if (!apiBase) return null

  const requestHost = headerStore.get('x-forwarded-host') || headerStore.get('host') || ''
  try {
    const res = await fetch(`${apiBase}/api/v1/settings/storefront/?lang=${DEFAULT_APP_LOCALE}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(requestHost ? { 'X-Forwarded-Host': requestHost } : {}),
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const config = (await res.json()) as { default_language?: string; languages?: string[] }
    const languages = uniqueAppLocales(config.languages ?? [])
    if (languages.length === 1) return languages[0]

    if (languages.length === 0) {
      return normalizeAppLocale(config.default_language)
    }
  } catch {
    return null
  }

  return null
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale
  const headerStore = await headers()
  const fromCookie = await getLocaleFromCookie()
  const fromSingleSiteLanguage = await getSingleSiteLocale(headerStore)
  const fromAcceptLanguage = getLocaleFromAcceptLanguageHeader(headerStore.get('accept-language') || '')
  const locale: AppLocale =
    fromSingleSiteLanguage ||
    (requested && isSupportedLocale(requested) ? requested : null) ||
    fromCookie ||
    fromAcceptLanguage ||
    routing.defaultLocale

  const [common, storefront, account, admin, auth, pluginMessages] = await Promise.all([
    loadCommonMessages(locale),
    loadAppMessages('storefront', locale),
    loadAppMessages('account', locale),
    loadAppMessages('admin', locale),
    loadAppMessages('auth', locale),
    loadPluginMessages(locale)
  ])

  const accountMerged = pluginMessages?.account ? deepMerge({ ...account }, pluginMessages.account as Messages) : account
  const adminMerged = pluginMessages?.admin ? deepMerge({ ...admin }, pluginMessages.admin as Messages) : admin
  const pluginNamespaces = pluginMessages
    ? Object.fromEntries(
        Object.entries(pluginMessages).filter(([k]) => k !== 'admin' && k !== 'account')
      )
    : {}

  return {
    locale,
    messages: {
      common,
      storefront,
      account: accountMerged,
      admin: adminMerged,
      auth,
      ...pluginNamespaces
    }
  }
})
