import {cookies, headers} from 'next/headers'
import {getRequestConfig} from 'next-intl/server'
import {routing, type AppLocale} from './routing'
import {loadPluginMessages} from './plugin-messages'

type Messages = Record<string, any>

const enabledApps = ['storefront', 'account', 'admin', 'auth'] as const
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

/**
 * Search-engine and AI crawlers. They send no `Accept-Language`, so without this check they
 * fall through to whatever the negotiation chain picks last — and would get a locale that is
 * not the site's own. The indexed copy of the site must be stable and in the default language,
 * so crawlers always get `routing.defaultLocale`.
 */
const CRAWLER_UA = /(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex(bot)?|applebot|facebookexternalhit|twitterbot|linkedinbot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-user|claude-searchbot|anthropic-ai|perplexitybot|perplexity-user|ccbot|amazonbot|meta-externalagent|bytespider|ahrefsbot|semrushbot|screaming frog|lighthouse|pagespeed)/i

async function isCrawlerRequest(): Promise<boolean> {
  const headerStore = await headers()
  return CRAWLER_UA.test(headerStore.get('user-agent') || '')
}

async function getLocaleFromAcceptLanguage(): Promise<AppLocale | null> {
  const headerStore = await headers()
  const al = (headerStore.get('accept-language') || '').toLowerCase()
  if (!al) return null
  // Minimal matching for our supported locales; English wins ties so an
  // `en-NZ,zh;q=0.5` header does not flip the store into Chinese.
  const enIndex = al.search(/\ben\b/)
  const zhIndex = al.search(/\bzh\b/)
  const matched: AppLocale | null =
    enIndex !== -1 && (zhIndex === -1 || enIndex <= zhIndex)
      ? 'en'
      : zhIndex !== -1
        ? ('zh-hans' as AppLocale)
        : null
  // A locale that is not enabled for this deployment must never win negotiation.
  return matched && isSupportedLocale(matched) ? matched : null
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale
  const [isCrawler, fromCookie, fromAcceptLanguage] = await Promise.all([
    isCrawlerRequest(),
    getLocaleFromCookie(),
    getLocaleFromAcceptLanguage()
  ])
  const locale: AppLocale = isCrawler
    ? routing.defaultLocale
    : (requested && isSupportedLocale(requested) ? requested : null) ||
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

