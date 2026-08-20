import { routing, type AppLocale } from './routing'

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
const DEFAULT_LOCALE: AppLocale = 'en'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';').map(entry => entry.trim())
  const target = cookies.find(entry => entry.startsWith(`${name}=`))
  if (!target) return null
  return decodeURIComponent(target.slice(name.length + 1))
}

export function getCurrentLocale(): AppLocale {
  const raw = readCookie(LOCALE_COOKIE_NAME)
  // Honour the enabled-locale list rather than a hardcoded pair: a stale NEXT_LOCALE
  // cookie from before a language was switched off must not leak back into API calls.
  if (raw && (routing.locales as readonly string[]).includes(raw)) return raw as AppLocale
  return DEFAULT_LOCALE
}

export function getApiLanguageHeaders(): Record<string, string> {
  return { 'Accept-Language': getCurrentLocale() }
}

