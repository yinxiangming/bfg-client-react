import {cookies, headers} from 'next/headers'
import {getRequestConfig} from 'next-intl/server'
import {routing, type AppLocale} from './routing'
import {loadPluginMessages} from './plugin-messages'

type Messages = Record<string, any>

const enabledApps = ['storefront', 'account', 'admin'] as const
type EnabledApp = (typeof enabledApps)[number]

function isSupportedLocale(locale: string): locale is AppLocale {
  return (routing.locales as readonly string[]).includes(locale)
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

async function getLocaleFromAcceptLanguage(): Promise<AppLocale | null> {
  const headerStore = await headers()
  const al = headerStore.get('accept-language') || ''
  // Minimal matching for our supported locales
  if (al.toLowerCase().includes('zh')) return 'zh-hans'
  if (al.toLowerCase().includes('en')) return 'en'
  return null
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale
  const fromCookie = await getLocaleFromCookie()
  const fromAcceptLanguage = await getLocaleFromAcceptLanguage()
  const locale: AppLocale =
    (requested && isSupportedLocale(requested) ? requested : null) ||
    fromCookie ||
    fromAcceptLanguage ||
    routing.defaultLocale

  const [common, storefront, account, admin, resalePlugin] = await Promise.all([
    loadCommonMessages(locale),
    loadAppMessages('storefront', locale),
    loadAppMessages('account', locale),
    loadAppMessages('admin', locale),
    loadPluginMessages(locale)
  ])

  const accountMerged = resalePlugin?.account ? deepMerge({ ...account }, resalePlugin.account) : account
  const adminMerged = resalePlugin?.admin ? deepMerge({ ...admin }, resalePlugin.admin) : admin
  const resaleNs = resalePlugin?.resale ?? {}

  return {
    locale,
    messages: {
      common,
      storefront,
      account: accountMerged,
      admin: adminMerged,
      resale: resaleNs
    }
  }
})

