// Web/CMS API services

import { apiFetch, bfgApi } from '@/utils/api'

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

export type Post = {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  category_id?: number
  category_name?: string
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
  'id' | 'category_name' | 'tag_names' | 'view_count' | 'created_at' | 'updated_at' | 'featured_image'
> & {
  featured_image?: string | File
}

export type Category = {
  id: number
  name: string
  slug: string
  description?: string
  parent_id?: number
  parent_name?: string
  content_type_name?: string
  icon?: string
  color?: string
  order: number
  is_active: boolean
  language: string
  created_at?: string
  updated_at?: string
}

export type CategoryPayload = Omit<Category, 'id' | 'parent_name' | 'created_at' | 'updated_at'>

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
  const response = await apiFetch<Site[] | { results: Site[] }>(bfgApi.sites())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getSite(id: number): Promise<Site> {
  return apiFetch<Site>(`${bfgApi.sites()}${id}/`)
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
      method: 'POST',
      body: formData
    })
  } else {
    return apiFetch<Site>(bfgApi.sites(), {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export async function updateSite(id: number, data: Partial<SitePayload>) {
  return apiFetch<Site>(`${bfgApi.sites()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteSite(id: number) {
  return apiFetch<void>(`${bfgApi.sites()}${id}/`, {
    method: 'DELETE'
  })
}

// Themes API
export async function getThemes(): Promise<Theme[]> {
  const response = await apiFetch<Theme[] | { results: Theme[] }>(bfgApi.themes())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getTheme(id: number): Promise<Theme> {
  return apiFetch<Theme>(`${bfgApi.themes()}${id}/`)
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
      method: 'POST',
      body: formData
    })
  } else {
    return apiFetch<Theme>(bfgApi.themes(), {
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
      method: 'PATCH',
      body: formData
    })
  } else {
    return apiFetch<Theme>(`${bfgApi.themes()}${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
}

export async function deleteTheme(id: number) {
  return apiFetch<void>(`${bfgApi.themes()}${id}/`, {
    method: 'DELETE'
  })
}

// Languages API
export async function getLanguages(): Promise<Language[]> {
  const response = await apiFetch<Language[] | { results: Language[] }>(bfgApi.languages())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getLanguage(id: number): Promise<Language> {
  return apiFetch<Language>(`${bfgApi.languages()}${id}/`)
}

export async function createLanguage(data: LanguagePayload) {
  return apiFetch<Language>(bfgApi.languages(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateLanguage(id: number, data: Partial<LanguagePayload>) {
  return apiFetch<Language>(`${bfgApi.languages()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteLanguage(id: number) {
  return apiFetch<void>(`${bfgApi.languages()}${id}/`, {
    method: 'DELETE'
  })
}

// Pages API
export async function getPages(): Promise<Page[]> {
  const response = await apiFetch<Page[] | { results: Page[] }>(bfgApi.pages())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getPage(id: number): Promise<Page> {
  return apiFetch<Page>(`${bfgApi.pages()}${id}/`)
}

export async function createPage(data: PagePayload) {
  return apiFetch<Page>(bfgApi.pages(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updatePage(id: number, data: Partial<PagePayload>) {
  return apiFetch<Page>(`${bfgApi.pages()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function updatePageBlocks(id: number, blocks: PageBlockItem[]) {
  return apiFetch<Page>(`${bfgApi.pages()}${id}/blocks/`, {
    method: 'PUT',
    body: JSON.stringify({ blocks })
  })
}

export async function deletePage(id: number) {
  return apiFetch<void>(`${bfgApi.pages()}${id}/`, {
    method: 'DELETE'
  })
}

// Posts API
export async function getPosts(): Promise<Post[]> {
  const response = await apiFetch<Post[] | { results: Post[] }>(bfgApi.posts())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getPost(id: number): Promise<Post> {
  return apiFetch<Post>(`${bfgApi.posts()}${id}/`)
}

export async function createPost(data: PostPayload) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'featured_image' && value instanceof File) {
        formData.append(key, value)
      } else if (key === 'tag_ids' && Array.isArray(value)) {
        value.forEach((tagId) => formData.append('tag_ids', String(tagId)))
      } else {
        formData.append(key, String(value))
      }
    }
  })
  return apiFetch<Post>(bfgApi.posts(), {
    method: 'POST',
    body: formData
  })
}

export async function updatePost(id: number, data: Partial<PostPayload>) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'featured_image' && value instanceof File) {
        formData.append(key, value)
      } else if (key === 'tag_ids' && Array.isArray(value)) {
        value.forEach((tagId) => formData.append('tag_ids', String(tagId)))
      } else {
        formData.append(key, String(value))
      }
    }
  })
  return apiFetch<Post>(`${bfgApi.posts()}${id}/`, {
    method: 'PATCH',
    body: formData
  })
}

export async function deletePost(id: number) {
  return apiFetch<void>(`${bfgApi.posts()}${id}/`, {
    method: 'DELETE'
  })
}

// Categories API
export async function getCategories(contentType?: string): Promise<Category[]> {
  const url = contentType ? `${bfgApi.categories()}?content_type=${contentType}` : bfgApi.categories()
  const response = await apiFetch<Category[] | { results: Category[] }>(url)
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getCategory(id: number): Promise<Category> {
  return apiFetch<Category>(`${bfgApi.categories()}${id}/`)
}

export async function createCategory(data: CategoryPayload) {
  return apiFetch<Category>(bfgApi.categories(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCategory(id: number, data: Partial<CategoryPayload>) {
  return apiFetch<Category>(`${bfgApi.categories()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteCategory(id: number) {
  return apiFetch<void>(`${bfgApi.categories()}${id}/`, {
    method: 'DELETE'
  })
}

// Tags API
export async function getTags(): Promise<Tag[]> {
  const response = await apiFetch<Tag[] | { results: Tag[] }>(bfgApi.tags())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getTag(id: number): Promise<Tag> {
  return apiFetch<Tag>(`${bfgApi.tags()}${id}/`)
}

export async function createTag(data: TagPayload) {
  return apiFetch<Tag>(bfgApi.tags(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateTag(id: number, data: Partial<TagPayload>) {
  return apiFetch<Tag>(`${bfgApi.tags()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteTag(id: number) {
  return apiFetch<void>(`${bfgApi.tags()}${id}/`, {
    method: 'DELETE'
  })
}

// Menus API
export async function getMenus(): Promise<Menu[]> {
  const response = await apiFetch<Menu[] | { results: Menu[] }>(bfgApi.menus())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getMenu(id: number): Promise<Menu> {
  return apiFetch<Menu>(`${bfgApi.menus()}${id}/`)
}

export async function createMenu(data: MenuPayload) {
  return apiFetch<Menu>(bfgApi.menus(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateMenu(id: number, data: Partial<MenuPayload>) {
  return apiFetch<Menu>(`${bfgApi.menus()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteMenu(id: number) {
  return apiFetch<void>(`${bfgApi.menus()}${id}/`, {
    method: 'DELETE'
  })
}

// Media API
export async function getMedia(): Promise<Media[]> {
  const response = await apiFetch<Media[] | { results: Media[] }>(bfgApi.media())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getMediaItem(id: number): Promise<Media> {
  return apiFetch<Media>(`${bfgApi.media()}${id}/`)
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
    method: 'PATCH',
    body: formData
  })
}

export async function deleteMedia(id: number) {
  return apiFetch<void>(`${bfgApi.media()}${id}/`, {
    method: 'DELETE'
  })
}

