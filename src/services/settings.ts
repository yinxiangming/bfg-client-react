// Settings API service (BFG2 Settings module)

import { apiFetch, bfgApi } from '@/utils/api'

export type User = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar?: string
  is_staff: boolean
  is_active: boolean
  is_superuser: boolean
  last_login?: string
  date_joined?: string
  default_workspace?: number
}

export type StaffRole = {
  id: number
  name: string
  description?: string
  permissions?: string[]
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type StorefrontHeaderOptionsPayload = {
  show_search?: boolean
  show_cart?: boolean
  show_language_switcher?: boolean
  show_style_selector?: boolean
  show_login?: boolean
}

export type StorefrontUiSettingsPayload = {
  theme?: string
  header?: string
  footer?: string
  header_options?: StorefrontHeaderOptionsPayload
}

export type WorkspaceSettings = {
  id: number
  workspace_id?: number
  site_name?: string
  site_description?: string
  custom_settings?: {
    invoice?: InvoiceSettingsPayload
    delivery?: DeliverySettingsPayload
    marketing?: MarketingSettingsPayload
    web?: WebSettingsPayload
    general?: GeneralSettingsPayload
    storefront_ui?: StorefrontUiSettingsPayload
  }
  created_at?: string
  updated_at?: string
}

export type InvoiceSettingsPayload = {
  invoice_prefix: string
  default_due_days: number
  default_footer: string
  enable_auto_number: boolean
  email_template_id?: number
}

export type DeliverySettingsPayload = {
  default_warehouse_id?: number
  default_carrier_id?: number
  free_shipping_threshold?: number
  default_packaging_type_id?: number
}

export type MarketingSettingsPayload = {
  default_referral_program_id?: number
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export type WebSettingsPayload = {
  default_site_id?: number
  default_theme_id?: number
  default_language?: string
  enable_comments?: boolean
  enable_search?: boolean
  seo_default_title?: string
  seo_default_description?: string
}

export type GeneralSettingsPayload = {
  site_name?: string
  site_description?: string
  default_language?: string
  default_currency?: string
  default_timezone?: string
  contact_email?: string
  contact_phone?: string
  facebook_url?: string
  twitter_url?: string
  instagram_url?: string
  top_bar_announcement?: string
  footer_copyright?: string
  site_announcement?: string
  footer_contact?: string
  logo?: string
}

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  const url = bfgApi.settings()
  console.log('[getWorkspaceSettings] Fetching from:', url)
  const res = await apiFetch<WorkspaceSettings | WorkspaceSettings[] | { results: WorkspaceSettings[] }>(url)
  console.log('[getWorkspaceSettings] Raw response:', res)
  console.log('[getWorkspaceSettings] Response type:', Array.isArray(res) ? 'array' : typeof res)
  console.log('[getWorkspaceSettings] Has results?', 'results' in (res || {}))
  
  // Handle paginated response
  if (res && typeof res === 'object' && 'results' in res) {
    const results = (res as { results: WorkspaceSettings[] }).results
    if (results.length === 0) {
      throw new Error('No workspace settings found. Please create settings first.')
    }
    console.log('[getWorkspaceSettings] Returning first item from paginated results:', results[0])
    return results[0]
  }
  
  // Handle array response
  if (Array.isArray(res)) {
    if (res.length === 0) {
      throw new Error('No workspace settings found. Please create settings first.')
    }
    console.log('[getWorkspaceSettings] Returning first item from array:', res[0])
    console.log('[getWorkspaceSettings] First item keys:', Object.keys(res[0] || {}))
    console.log('[getWorkspaceSettings] First item id:', res[0]?.id)
    return res[0]
  }
  
  // Handle single object response
  if (res && typeof res === 'object') {
    console.log('[getWorkspaceSettings] Returning object:', res)
    console.log('[getWorkspaceSettings] Object keys:', Object.keys(res))
    console.log('[getWorkspaceSettings] Object id:', (res as any).id)
    return res as WorkspaceSettings
  }
  
  throw new Error('Invalid settings response format: ' + JSON.stringify(res))
}

export async function updateInvoiceSettings(settingsId: number, invoice: InvoiceSettingsPayload) {
  // PATCH custom_settings.invoice only, preserving other custom_settings
  const current = await apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`)
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, invoice }

  return apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateDeliverySettings(settingsId: number, delivery: DeliverySettingsPayload) {
  // PATCH custom_settings.delivery only, preserving other custom_settings
  const current = await apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`)
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, delivery }

  return apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateMarketingSettings(settingsId: number, marketing: MarketingSettingsPayload) {
  // PATCH custom_settings.marketing only, preserving other custom_settings
  const current = await apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`)
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, marketing }

  return apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateWebSettings(settingsId: number, web: WebSettingsPayload) {
  // PATCH custom_settings.web only, preserving other custom_settings
  const current = await apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`)
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, web }

  return apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateGeneralSettings(settingsId: number, general: GeneralSettingsPayload) {
  // PATCH custom_settings.general only, preserving other custom_settings
  const url = `${bfgApi.settings()}${settingsId}/`
  const current = await apiFetch<WorkspaceSettings>(url)
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, general }
  return apiFetch<WorkspaceSettings>(url, {
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateStorefrontUiSettings(settingsId: number, storefront_ui: StorefrontUiSettingsPayload) {
  const url = `${bfgApi.settings()}${settingsId}/`
  const current = await apiFetch<WorkspaceSettings>(url)
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, storefront_ui }
  return apiFetch<WorkspaceSettings>(url, {
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

// Users management
export async function getUsers(): Promise<User[]> {
  const res = await apiFetch<{ results: User[] } | User[]>(bfgApi.users())
  if ('results' in res) {
    return res.results
  }
  return res
}

export async function getUser(id: number): Promise<User> {
  return apiFetch<User>(`${bfgApi.users()}${id}/`)
}

export async function createUser(user: Partial<User>): Promise<User> {
  return apiFetch<User>(bfgApi.users(), {
    method: 'POST',
    body: JSON.stringify(user)
  })
}

export async function updateUser(id: number, user: Partial<User>): Promise<User> {
  return apiFetch<User>(`${bfgApi.users()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(user)
  })
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch<void>(`${bfgApi.users()}${id}/`, {
    method: 'DELETE'
  })
}

// Staff Roles management
export async function getStaffRoles(): Promise<StaffRole[]> {
  const res = await apiFetch<{ results: StaffRole[] } | StaffRole[]>(bfgApi.staffRoles())
  if ('results' in res) {
    return res.results
  }
  return res
}

export async function getStaffRole(id: number): Promise<StaffRole> {
  return apiFetch<StaffRole>(`${bfgApi.staffRoles()}${id}/`)
}

export async function createStaffRole(role: Partial<StaffRole>): Promise<StaffRole> {
  return apiFetch<StaffRole>(bfgApi.staffRoles(), {
    method: 'POST',
    body: JSON.stringify(role)
  })
}

export async function updateStaffRole(id: number, role: Partial<StaffRole>): Promise<StaffRole> {
  return apiFetch<StaffRole>(`${bfgApi.staffRoles()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(role)
  })
}

export async function deleteStaffRole(id: number): Promise<void> {
  await apiFetch<void>(`${bfgApi.staffRoles()}${id}/`, {
    method: 'DELETE'
  })
}

