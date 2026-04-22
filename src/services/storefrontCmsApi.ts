import { getApiBaseUrl, getApiHeaders } from '@/utils/api'
import { getCmsPageFetchLanguages } from '@/utils/storefrontCmsPage'

export async function fetchRenderedCmsPage(
  slug: string,
  locale: string,
  requestHost?: string,
  options?: { revalidate?: number; cache?: RequestCache }
): Promise<any | null> {
  const langs = getCmsPageFetchLanguages(locale)
  const headerOpts = requestHost ? { requestHost } : {}
  const apiUrl = getApiBaseUrl()

  for (const lang of langs) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch(
        `${apiUrl}/api/v1/web/pages/${encodeURIComponent(slug)}/rendered/?lang=${encodeURIComponent(lang)}`,
        {
          ...(options?.cache ? { cache: options.cache } : {}),
          ...(typeof options?.revalidate === 'number' ? { next: { revalidate: options.revalidate } } : {}),
          headers: getApiHeaders({}, headerOpts),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)
      if (res.ok) return res.json()
    } catch {
      clearTimeout(timeoutId)
    }
  }

  return null
}
