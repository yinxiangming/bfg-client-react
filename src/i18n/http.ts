import { DEFAULT_APP_LOCALE, normalizeAppLocale, type AppLocale } from './locales'

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';').map(entry => entry.trim())
  const target = cookies.find(entry => entry.startsWith(`${name}=`))
  if (!target) return null
  return decodeURIComponent(target.slice(name.length + 1))
}

export function getCurrentLocale(): AppLocale {
  const raw = readCookie(LOCALE_COOKIE_NAME)
  return normalizeAppLocale(raw) ?? DEFAULT_APP_LOCALE
}

export function getApiLanguageHeaders(): Record<string, string> {
  return { 'Accept-Language': getCurrentLocale() }
}
