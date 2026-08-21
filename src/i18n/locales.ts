export const APP_LOCALES = ['en', 'zh-hans'] as const
export type AppLocale = (typeof APP_LOCALES)[number]

export const DEFAULT_APP_LOCALE: AppLocale = 'en'

export const LOCALE_OPTIONS: Array<{
  value: AppLocale
  labelKey: string
  shortLabel: string
}> = [
  { value: 'en', labelKey: 'language.en', shortLabel: 'EN' },
  { value: 'zh-hans', labelKey: 'language.zhHans', shortLabel: '中' },
]

export function normalizeAppLocale(locale?: string | null): AppLocale | null {
  if (!locale) return null
  const normalized = locale.trim().toLowerCase()
  return APP_LOCALES.find(value => value === normalized) ?? null
}

export function uniqueAppLocales(locales: Array<string | null | undefined>): AppLocale[] {
  const seen = new Set<AppLocale>()
  const result: AppLocale[] = []

  locales.forEach(locale => {
    const normalized = normalizeAppLocale(locale)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    result.push(normalized)
  })

  return result
}
