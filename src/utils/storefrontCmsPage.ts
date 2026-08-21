/**
 * CMS page `/rendered/` language attempts: current locale first, then English only.
 * Does not hardcode other locale codes; site content can live in `en` as canonical fallback.
 */
export function getCmsPageFetchLanguages(locale: string, availableLanguages?: string[]): string[] {
  const supportedLanguages = Array.isArray(availableLanguages)
    ? availableLanguages.map(lang => lang.trim()).filter(Boolean)
    : []

  if (supportedLanguages.length === 1) {
    return supportedLanguages
  }

  const primary = (locale || '').trim() || 'en'
  const fallback = 'en'
  if (supportedLanguages.length > 1) {
    const attempts = [primary, fallback].filter(lang => supportedLanguages.includes(lang))
    return Array.from(new Set(attempts.length ? attempts : supportedLanguages))
  }
  if (primary === fallback) return [fallback]
  return [primary, fallback]
}
