/**
 * CMS page `/rendered/` language attempts: current locale first, then English only.
 * Does not hardcode other locale codes; site content can live in `en` as canonical fallback.
 */
export function getCmsPageFetchLanguages(locale: string): string[] {
  const primary = (locale || '').trim() || 'en'
  const fallback = 'en'
  if (primary === fallback) return [fallback]
  return [primary, fallback]
}
