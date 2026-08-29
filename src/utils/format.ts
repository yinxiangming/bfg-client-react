// Formatting utility functions

import { getCurrentLocale } from '@/i18n/http'

function toIntlLocale(locale: string): string {
  // Normalize locales for Intl APIs
  if (locale === 'zh-hans') return 'zh-Hans'
  return locale
}

export function getIntlLocale(locale?: string): string {
  const resolved = locale || getCurrentLocale()
  return toIntlLocale(resolved)
}

/** Code-level fallback when no currency is known. Mirrors the server's `DEFAULT_CURRENCY_CODE`. */
export const DEFAULT_CURRENCY_CODE = 'USD'

/**
 * Coerce a currency code into something `Intl` accepts.
 *
 * `Intl.NumberFormat` throws a RangeError on anything that isn't three ASCII
 * letters, so an empty or malformed code coming back from the API would take
 * down whatever page renders a price. Well-formed but unknown codes are safe —
 * `Intl` renders those as the code itself.
 */
export function normalizeCurrencyCode(code?: string | null, fallback: string = DEFAULT_CURRENCY_CODE): string {
  const trimmed = (code ?? '').trim().toUpperCase()
  return /^[A-Z]{3}$/.test(trimmed) ? trimmed : fallback
}

export function formatCurrency(
  value: number | string,
  currency: string = DEFAULT_CURRENCY_CODE,
  locale?: string
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '-'
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency: normalizeCurrencyCode(currency)
  }).format(numValue)
}

/**
 * Format date with custom format string
 * Supports format tokens: yyyy, MM, dd, HH, mm, ss
 * Examples: 'yyyy-mm-dd', 'yyyy/MM/dd', 'yyyy-MM-dd HH:mm:ss'
 */
export function formatDate(value: string | Date, format?: string, locale?: string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '-'
  
  if (format) {
    return formatDateWithPattern(date, format)
  }
  
  // Default format
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

/**
 * Format datetime with custom format string
 * Supports format tokens: yyyy, MM, dd, HH, mm, ss
 */
export function formatDateTime(value: string | Date, format?: string, locale?: string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '-'
  
  if (format) {
    return formatDateWithPattern(date, format)
  }
  
  // Default format
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Format date with pattern string
 * Supports: yyyy, MM, dd, HH, mm, ss
 */
function formatDateWithPattern(date: Date, pattern: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return pattern
    .replace(/yyyy/g, String(year))
    .replace(/MM/g, month)
    .replace(/dd/g, day)
    .replace(/HH/g, hours)
    .replace(/mm/g, minutes)
    .replace(/ss/g, seconds)
}

export function formatNumber(value: number | string, decimals: number = 2, locale?: string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '-'
  return new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue)
}

