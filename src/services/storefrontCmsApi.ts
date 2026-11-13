import { getApiBaseUrl, getApiHeaders } from '@/utils/api'
import { getCmsPageFetchLanguages } from '@/utils/storefrontCmsPage'

export type PublishedCmsPost = {
  id: number
  slug: string
  title: string
  excerpt?: string
  featured_image?: string
  category_slug?: string
  category_name?: string
  custom_fields?: Record<string, unknown>
  language?: string
  updated_at?: string
  published_at?: string
}

/** Public, paginated endpoint. Never use the staff collection for a storefront. */
export async function fetchPublishedCmsPosts(
  locale: string, requestHost?: string,
  options?: { categorySlug?: string; languages?: string[]; revalidate?: number }
): Promise<PublishedCmsPost[]> {
  const headers = getApiHeaders({}, requestHost ? { requestHost } : {})
  for (const language of getCmsPageFetchLanguages(locale, options?.languages)) {
    const posts: PublishedCmsPost[] = []
    for (let page = 1; page <= 250; page++) {
      const params = new URLSearchParams({ lang: language, page_size: '200', page: String(page) })
      if (options?.categorySlug) params.set('category_slug', options.categorySlug)
      const res = await fetch(`${getApiBaseUrl()}/api/v1/web/posts/published/?${params}`, {
        headers, next: { revalidate: options?.revalidate ?? 60 }, signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error('Published content is unavailable')
      const data = await res.json()
      posts.push(...(data.results ?? data))
      if (!data.next) break
      if (page === 250) throw new Error('Published catalogue exceeds the pagination limit')
    }
    if (posts.length) return posts
  }
  return []
}

export async function fetchRenderedCmsPage(
  slug: string,
  locale: string,
  requestHost?: string,
  options?: { revalidate?: number; cache?: RequestCache; languages?: string[] }
): Promise<any | null> {
  const langs = getCmsPageFetchLanguages(locale, options?.languages)
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

export async function fetchRenderedCmsPost(
  slug: string,
  locale: string,
  requestHost?: string,
  options?: { revalidate?: number; cache?: RequestCache; languages?: string[] }
): Promise<any | null> {
  const langs = getCmsPageFetchLanguages(locale, options?.languages)
  const headerOpts = requestHost ? { requestHost } : {}
  const apiUrl = getApiBaseUrl()

  for (const lang of langs) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch(
        `${apiUrl}/api/v1/web/posts/${encodeURIComponent(slug)}/rendered/?lang=${encodeURIComponent(lang)}`,
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
