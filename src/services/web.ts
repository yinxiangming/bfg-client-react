// Web/CMS API services

import { apiFetch, bfgApi } from '@/utils/api'
import { getSiteAdminOptions } from '@/services/settings'

export type Site = {
  id: number
  name: string
  domain: string
  theme_id?: number
  theme_name?: string
  default_language: string
  languages?: string[]
  site_title?: string
  site_description?: string
  is_active: boolean
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export type SitePayload = Omit<Site, 'id' | 'theme_name' | 'created_at' | 'updated_at'>

export type Theme = {
  id: number
  name: string
  code: string
  description?: string
  template_path?: string
  logo?: string
  favicon?: string
  primary_color?: string
  secondary_color?: string
  custom_css?: string
  custom_js?: string
  config?: Record<string, any>
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type ThemePayload = Omit<Theme, 'id' | 'created_at' | 'updated_at' | 'logo' | 'favicon'> & {
  logo?: string | File
  favicon?: string | File
}

export type Language = {
  id: number
  code: string
  name: string
  native_name: string
  is_default: boolean
  is_active: boolean
  is_rtl: boolean
  order: number
  created_at?: string
  updated_at?: string
}

export type LanguagePayload = Omit<Language, 'id' | 'created_at' | 'updated_at'>

/** Block config shape from API (id, type, settings, data) */
export type PageBlockItem = {
  id?: string
  type: string
  settings?: Record<string, unknown>
  data?: Record<string, unknown>
  resolvedData?: unknown
}

export type Page = {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  parent_id?: number
  parent_title?: string
  template?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  allow_comments: boolean
  order: number
  language: string
  published_at?: string
  created_at?: string
  updated_at?: string
  blocks?: PageBlockItem[]
}

export type PagePayload = Omit<Page, 'id' | 'parent_title' | 'created_at' | 'updated_at'>

/** Single custom field definition on a CMS category (drives post custom_fields UI). */
export type CategoryFieldSchemaEntry = {
  type?: 'string' | 'text' | 'integer' | 'number' | 'boolean' | 'select' | 'image'
  required?: boolean
  label?: string
  label_zh?: string
  description?: string
  default?: string | number | boolean
  options?: Array<{ label: string; value: string; label_en?: string }>
}

export type CategoryFieldsSchema = Record<string, CategoryFieldSchemaEntry>

export type Post = {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  /** Normalized from API `category` (FK id) */
  category_id?: number
  category_name?: string
  /** Category template for custom field inputs (detail API only) */
  category_fields_schema?: CategoryFieldsSchema
  custom_fields?: Record<string, unknown>
  tag_ids?: number[]
  tag_names?: string[]
  meta_title?: string
  meta_description?: string
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  allow_comments: boolean
  language: string
  view_count?: number
  created_at?: string
  updated_at?: string
}

export type PostPayload = Omit<
  Post,
  | 'id'
  | 'category_name'
  | 'tag_names'
  | 'view_count'
  | 'created_at'
  | 'updated_at'
  | 'featured_image'
  | 'category_fields_schema'
> & {
  featured_image?: string | File
}

export type Category = {
  id: number
  name: string
  slug: string
  description?: string
  /** API returns `parent` (FK id); normalized to `parent_id` in some callers */
  parent?: number | null
  parent_id?: number
  parent_name?: string
  content_type_name?: string
  fields_schema?: CategoryFieldsSchema
  fields_count?: number
  icon?: string
  color?: string
  order: number
  is_active: boolean
  language: string
  created_at?: string
  updated_at?: string
}

export type CategoryPayload = Omit<Category, 'id' | 'parent_name' | 'created_at' | 'updated_at' | 'fields_count'>

export type CategoryTemplateSummary = {
  key: string
  name: string
  name_zh?: string
  content_type_name: string
  icon?: string
  description?: string
  description_zh?: string
  fields_count?: number
}

export type CategorySchemaTemplateDetail = CategoryTemplateSummary & {
  fields_schema: CategoryFieldsSchema
}

export type Tag = {
  id: number
  name: string
  slug: string
  language: string
  created_at?: string
  updated_at?: string
}

export type TagPayload = Omit<Tag, 'id' | 'created_at' | 'updated_at'>

export type MenuItem = {
  id: number
  title: string
  url: string
  page_id?: number
  post_id?: number
  parent_id?: number
  icon?: string
  css_class?: string
  order: number
  open_in_new_tab: boolean
  is_active: boolean
}

export type Menu = {
  id: number
  name: string
  slug: string
  location: 'header' | 'footer' | 'sidebar'
  language: string
  is_active: boolean
  items?: MenuItem[]
  items_count?: number
  created_at?: string
  updated_at?: string
}

export type MenuPayload = Omit<Menu, 'id' | 'items_count' | 'created_at' | 'updated_at'>

export type Media = {
  id: number
  file: string
  file_name?: string
  file_type?: 'image' | 'document' | 'video'
  file_size?: number
  title?: string
  alt_text?: string
  caption?: string
  uploaded_at?: string
  created_at?: string
  updated_at?: string
}

export type MediaPayload = {
  file?: File
  title?: string
  alt_text?: string
  caption?: string
}

// Sites API
export async function getSites(): Promise<Site[]> {
  const response = await apiFetch<Site[] | { results: Site[] }>(bfgApi.sites(), getSiteAdminOptions())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getSite(id: number): Promise<Site> {
  return apiFetch<Site>(`${bfgApi.sites()}${id}/`, getSiteAdminOptions())
}

export async function createSite(data: SitePayload) {
  // Check if data contains File objects (for file uploads)
  const hasFiles = false // SitePayload doesn't typically have files, but themes might

  if (hasFiles) {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      const value = (data as any)[key]
      if (value instanceof File) {
        formData.append(key, value)
      } else if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, String(v)))
        } else {
          formData.append(key, String(value))
        }
      }
    })
    return apiFetch<Site>(bfgApi.sites(), {
      ...getSiteAdminOptions(),
      method: 'POST',
      body: formData
    })
  } else {
    return apiFetch<Site>(bfgApi.sites(), {
      ...getSiteAdminOptions(),
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export async function updateSite(id: number, data: Partial<SitePayload>) {
  return apiFetch<Site>(`${bfgApi.sites()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteSite(id: number) {
  return apiFetch<void>(`${bfgApi.sites()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Themes API
export async function getThemes(): Promise<Theme[]> {
  const response = await apiFetch<Theme[] | { results: Theme[] }>(bfgApi.themes(), getSiteAdminOptions())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getTheme(id: number): Promise<Theme> {
  return apiFetch<Theme>(`${bfgApi.themes()}${id}/`, getSiteAdminOptions())
}

export async function createTheme(data: ThemePayload) {
  // Check if data contains File objects (for logo/favicon uploads)
  const maybeLogo: any = (data as any).logo
  const maybeFavicon: any = (data as any).favicon
  const hasFiles = maybeLogo instanceof File || maybeFavicon instanceof File

  if (hasFiles) {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      const value = (data as any)[key]
      if (value instanceof File) {
        formData.append(key, value)
      } else if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
    })
    return apiFetch<Theme>(bfgApi.themes(), {
    ...getSiteAdminOptions(),
      method: 'POST',
      body: formData
    })
  } else {
    return apiFetch<Theme>(bfgApi.themes(), {
    ...getSiteAdminOptions(),
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export async function updateTheme(id: number, data: Partial<ThemePayload>) {
  // Check if data contains File objects (for logo/favicon uploads)
  const maybeLogo: any = (data as any).logo
  const maybeFavicon: any = (data as any).favicon
  const hasFiles = maybeLogo instanceof File || maybeFavicon instanceof File

  if (hasFiles) {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      const value = (data as any)[key]
      if (value instanceof File) {
        formData.append(key, value)
      } else if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
    })
    return apiFetch<Theme>(`${bfgApi.themes()}${id}/`, {
    ...getSiteAdminOptions(),
      method: 'PATCH',
      body: formData
    })
  } else {
    return apiFetch<Theme>(`${bfgApi.themes()}${id}/`, {
    ...getSiteAdminOptions(),
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
}

export async function deleteTheme(id: number) {
  return apiFetch<void>(`${bfgApi.themes()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Languages API
export async function getLanguages(): Promise<Language[]> {
  const response = await apiFetch<Language[] | { results: Language[] }>(bfgApi.languages(), getSiteAdminOptions())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getLanguage(id: number): Promise<Language> {
  return apiFetch<Language>(`${bfgApi.languages()}${id}/`, getSiteAdminOptions())
}

export async function createLanguage(data: LanguagePayload) {
  return apiFetch<Language>(bfgApi.languages(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateLanguage(id: number, data: Partial<LanguagePayload>) {
  return apiFetch<Language>(`${bfgApi.languages()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteLanguage(id: number) {
  return apiFetch<void>(`${bfgApi.languages()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Pages API
export async function getPages(): Promise<Page[]> {
  const response = await apiFetch<Page[] | { results: Page[] }>(bfgApi.pages(), getSiteAdminOptions())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getPage(id: number): Promise<Page> {
  return apiFetch<Page>(`${bfgApi.pages()}${id}/`, getSiteAdminOptions())
}

export async function createPage(data: PagePayload) {
  return apiFetch<Page>(bfgApi.pages(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updatePage(id: number, data: Partial<PagePayload>) {
  return apiFetch<Page>(`${bfgApi.pages()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function updatePageBlocks(id: number, blocks: PageBlockItem[]) {
  return apiFetch<Page>(`${bfgApi.pages()}${id}/blocks/`, {
    ...getSiteAdminOptions(),
    method: 'PUT',
    body: JSON.stringify({ blocks })
  })
}

export async function deletePage(id: number) {
  return apiFetch<void>(`${bfgApi.pages()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Posts API
function normalizePost(raw: Record<string, unknown>): Post {
  const tags = raw.tags as { id: number }[] | undefined
  const tag_ids =
    (raw.tag_ids as number[] | undefined) ?? (Array.isArray(tags) ? tags.map(t => t.id) : undefined) ?? []
  const category_id = (raw.category_id as number | undefined) ?? (raw.category as number | null | undefined) ?? undefined
  return {
    ...(raw as unknown as Post),
    tag_ids,
    category_id,
    custom_fields: (raw.custom_fields as Record<string, unknown>) ?? {},
    category_fields_schema: raw.category_fields_schema as CategoryFieldsSchema | undefined
  }
}

function appendPostToFormData(formData: FormData, data: Partial<PostPayload>): void {
  const { category_id, custom_fields, tag_ids, featured_image, ...rest } = data

  Object.entries(rest).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    formData.append(key, String(value))
  })

  if (category_id !== undefined && category_id !== null) {
    formData.append('category', String(category_id))
  }

  if (custom_fields !== undefined) {
    formData.append('custom_fields', JSON.stringify(custom_fields ?? {}))
  }

  if (Array.isArray(tag_ids)) {
    tag_ids.forEach(tagId => formData.append('tag_ids', String(tagId)))
  }

  if (featured_image !== undefined && featured_image !== null) {
    if (featured_image instanceof File) {
      formData.append('featured_image', featured_image)
    } else if (typeof featured_image === 'string') {
      formData.append('featured_image', featured_image)
    }
  }
}

type PostsListPage = {
  results?: Record<string, unknown>[]
  next?: string | null
}

/**
 * Fetches all posts for the workspace (follows DRF pagination until exhausted).
 */
export async function getPosts(): Promise<Post[]> {
  const opts = getSiteAdminOptions()
  const collected: Post[] = []
  let url: string | null = bfgApi.posts()

  while (url) {
    const page: PostsListPage | Record<string, unknown>[] = await apiFetch<
      PostsListPage | Record<string, unknown>[]
    >(url, opts)
    if (Array.isArray(page)) {
      for (const row of page) {
        collected.push(normalizePost(row as Record<string, unknown>))
      }
      break
    }
    const rows = page.results ?? []
    for (const row of rows) {
      collected.push(normalizePost(row as Record<string, unknown>))
    }
    const nextLink: string | null | undefined = page.next
    url = typeof nextLink === 'string' && nextLink.length > 0 ? nextLink : null
  }

  return collected
}

export async function getPost(id: number): Promise<Post> {
  const raw = await apiFetch<Record<string, unknown>>(`${bfgApi.posts()}${id}/`, getSiteAdminOptions())
  return normalizePost(raw)
}

export async function createPost(data: PostPayload) {
  const formData = new FormData()
  appendPostToFormData(formData, data)
  const raw = await apiFetch<Record<string, unknown>>(bfgApi.posts(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: formData
  })
  return normalizePost(raw)
}

export async function updatePost(id: number, data: Partial<PostPayload>) {
  const formData = new FormData()
  appendPostToFormData(formData, data)
  const raw = await apiFetch<Record<string, unknown>>(`${bfgApi.posts()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: formData
  })
  return normalizePost(raw)
}

export async function deletePost(id: number) {
  return apiFetch<void>(`${bfgApi.posts()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Categories API
function normalizeCategory(c: Category & { parent?: number | null }): Category {
  const parent_id = c.parent_id ?? c.parent ?? undefined
  return { ...c, parent_id, parent: c.parent }
}

type CategoriesListPage = {
  results?: (Category & { parent?: number | null })[]
  next?: string | null
}

/**
 * Fetches all categories for the workspace (follows DRF pagination until exhausted).
 */
export async function getCategories(contentType?: string): Promise<Category[]> {
  const qs = contentType ? `?content_type=${encodeURIComponent(contentType)}` : ''
  const opts = getSiteAdminOptions()
  const collected: (Category & { parent?: number | null })[] = []
  let url: string | null = `${bfgApi.categories()}${qs}`

  while (url) {
    const page: CategoriesListPage | (Category & { parent?: number | null })[] = await apiFetch<
      CategoriesListPage | (Category & { parent?: number | null })[]
    >(url, opts)
    if (Array.isArray(page)) {
      collected.push(...page)
      break
    }
    const rows = page.results ?? []
    collected.push(...rows)
    const nextLink: string | null | undefined = page.next
    url = typeof nextLink === 'string' && nextLink.length > 0 ? nextLink : null
  }

  return collected.map(normalizeCategory)
}

export async function getCategory(id: number): Promise<Category> {
  const c = await apiFetch<Category & { parent?: number | null }>(`${bfgApi.categories()}${id}/`, getSiteAdminOptions())
  return normalizeCategory(c)
}

export async function getCategoryTemplateSummaries(): Promise<CategoryTemplateSummary[]> {
  return apiFetch<CategoryTemplateSummary[]>(`${bfgApi.categories()}templates/`, getSiteAdminOptions())
}

export async function getCategorySchemaTemplate(key: string): Promise<CategorySchemaTemplateDetail> {
  const q = new URLSearchParams({ key })
  return apiFetch<CategorySchemaTemplateDetail>(
    `${bfgApi.categories()}schema-template/?${q.toString()}`,
    getSiteAdminOptions()
  )
}

function categoryBodyForApi(data: Partial<CategoryPayload>): Record<string, unknown> {
  const { parent_id, ...rest } = data
  const body: Record<string, unknown> = { ...rest }
  if ('parent_id' in data) {
    body.parent = parent_id ?? null
  }
  return body
}

export async function createCategory(data: CategoryPayload) {
  const c = await apiFetch<Category & { parent?: number | null }>(bfgApi.categories(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(categoryBodyForApi(data))
  })
  return normalizeCategory(c)
}

export async function updateCategory(id: number, data: Partial<CategoryPayload>) {
  const c = await apiFetch<Category & { parent?: number | null }>(`${bfgApi.categories()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(categoryBodyForApi(data))
  })
  return normalizeCategory(c)
}

export async function deleteCategory(id: number) {
  return apiFetch<void>(`${bfgApi.categories()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Tags API
export async function getTags(): Promise<Tag[]> {
  const response = await apiFetch<Tag[] | { results: Tag[] }>(bfgApi.tags(), getSiteAdminOptions())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getTag(id: number): Promise<Tag> {
  return apiFetch<Tag>(`${bfgApi.tags()}${id}/`, getSiteAdminOptions())
}

export async function createTag(data: TagPayload) {
  return apiFetch<Tag>(bfgApi.tags(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateTag(id: number, data: Partial<TagPayload>) {
  return apiFetch<Tag>(`${bfgApi.tags()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteTag(id: number) {
  return apiFetch<void>(`${bfgApi.tags()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Menus API
export async function getMenus(): Promise<Menu[]> {
  const response = await apiFetch<Menu[] | { results: Menu[] }>(bfgApi.menus(), getSiteAdminOptions())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getMenu(id: number): Promise<Menu> {
  return apiFetch<Menu>(`${bfgApi.menus()}${id}/`, getSiteAdminOptions())
}

export async function createMenu(data: MenuPayload) {
  return apiFetch<Menu>(bfgApi.menus(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateMenu(id: number, data: Partial<MenuPayload>) {
  return apiFetch<Menu>(`${bfgApi.menus()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteMenu(id: number) {
  return apiFetch<void>(`${bfgApi.menus()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Media API
export async function getMedia(): Promise<Media[]> {
  const response = await apiFetch<Media[] | { results: Media[] }>(bfgApi.media(), getSiteAdminOptions())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getMediaItem(id: number): Promise<Media> {
  return apiFetch<Media>(`${bfgApi.media()}${id}/`, getSiteAdminOptions())
}

export async function uploadMedia(data: MediaPayload) {
  const formData = new FormData()
  if (data.file) {
    formData.append('file', data.file)
  }
  if (data.title) {
    formData.append('title', data.title)
  }
  if (data.alt_text) {
    formData.append('alt_text', data.alt_text)
  }
  if (data.caption) {
    formData.append('caption', data.caption)
  }
  return apiFetch<Media>(bfgApi.media(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: formData
  })
}

export async function updateMedia(id: number, data: Partial<MediaPayload>) {
  const formData = new FormData()
  if (data.file) {
    formData.append('file', data.file)
  }
  if (data.title !== undefined) {
    formData.append('title', data.title || '')
  }
  if (data.alt_text !== undefined) {
    formData.append('alt_text', data.alt_text || '')
  }
  if (data.caption !== undefined) {
    formData.append('caption', data.caption || '')
  }
  return apiFetch<Media>(`${bfgApi.media()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: formData
  })
}

export async function deleteMedia(id: number) {
  return apiFetch<void>(`${bfgApi.media()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

