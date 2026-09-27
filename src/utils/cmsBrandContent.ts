/** Small, presentation-neutral helpers for reading brand content from CMS pages. */

export type CmsBrandPost = {
  id?: number
  title?: string
  slug?: string
  excerpt?: string
  featured_image?: string
  category_name?: string | null
  custom_fields?: Record<string, unknown>
}

type CmsBlock = {
  id?: string
  type?: string
  settings?: Record<string, unknown>
  data?: Record<string, any>
  resolvedData?: unknown
}

function blocksOf(pageData: any): CmsBlock[] {
  return Array.isArray(pageData?.blocks) ? pageData.blocks : []
}

function localized(value: unknown, locale = 'en'): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  const candidate = record[locale] ?? record.en ?? record['zh-hans']
  return typeof candidate === 'string' ? candidate : ''
}

export function cmsBlock(pageData: any, id: string): CmsBlock | undefined {
  return blocksOf(pageData).find(block => block.id === id)
}

export function cmsBlocks(pageData: any, type: string): CmsBlock[] {
  return blocksOf(pageData).filter(block => block.type === type)
}

export function cmsHero(pageData: any, locale = 'en') {
  const block = blocksOf(pageData).find(block => block.type === 'hero_v1' || block.type === 'hero_carousel_v1')
  const data = block?.data ?? {}
  const settings = block?.settings ?? {}
  const slides = Array.isArray(data.slides) ? data.slides : []
  return {
    image: typeof settings.image === 'string' ? settings.image : '',
    title: localized(data.title, locale),
    subtitle: localized(data.subtitle, locale),
    slides: slides.map((slide: any) => ({
      image: typeof slide?.image === 'string' ? slide.image : '',
      title: localized(slide?.title, locale),
      subtitle: localized(slide?.subtitle, locale),
      link: typeof slide?.buttonLink === 'string' ? slide.buttonLink : '',
    })).filter((slide: { image: string }) => slide.image),
  }
}

export function cmsText(pageData: any, locale = 'en'): string[] {
  return blocksOf(pageData)
    .filter(block => block.type === 'text_block_v1')
    .map(block => localized(block.data?.content, locale))
    .filter(Boolean)
}

export function cmsPosts(pageData: any): CmsBrandPost[] {
  const posts: CmsBrandPost[] = []
  for (const block of blocksOf(pageData)) {
    if (!['post_list_v1', 'post_grid_v1', 'project_grid_v1', 'case_list_v1'].includes(block.type || '')) continue
    if (!Array.isArray(block.resolvedData)) continue
    for (const post of block.resolvedData) {
      if (!post || typeof post !== 'object' || !post.slug) continue
      if (!posts.some(item => item.slug === post.slug)) posts.push(post as CmsBrandPost)
    }
  }
  return posts
}

export function cmsPostImage(post: CmsBrandPost): string {
  const customImage = post.custom_fields?.brand_image
  if (typeof customImage === 'string' && customImage.trim()) return customImage.trim()
  return typeof post.featured_image === 'string' ? post.featured_image : ''
}
