// Settings API service (BFG2 Settings module)

import { apiFetch, bfgApi } from '@/utils/api'

export function getSiteAdminRequestHost(): string | undefined {
  return typeof window !== 'undefined' ? window.location.host : undefined
}

export function getSiteAdminOptions() {
  const requestHost = getSiteAdminRequestHost()
  return {
    requestHost,
    siteAdminScope: true as const,
  }
}

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
  show_register?: boolean
}

export type StorefrontUiSettingsPayload = {
  theme?: string
  header?: string
  footer?: string
  header_options?: StorefrontHeaderOptionsPayload
  supported_currencies?: string[]
  /**
   * Allowed color modes (subset of ['light', 'dark']). Single-entry → the
   * frontend forces that mode and hides any switcher. Default both.
   */
  allowed_color_modes?: ('light' | 'dark')[]
  /** Preferred default; meaningful only when both modes are allowed. */
  default_color_mode?: 'light' | 'dark' | 'system'
}

export type AnalyticsSettingsPayload = {
  /**
   * GA4 measurement id (`G-XXXXXXXXXX`). Public client-side tag id, not a
   * secret. Blank disables tracking for this workspace.
   */
  google_analytics_id?: string
}

export type ShopSettingsPayload = {
  review_moderation_required?: boolean
  product_identifiers?: {
    sku_prefix?: string
    barcode_prefix?: string
  }
  /**
   * SKU / stock visibility and out-of-stock behaviour for the storefront. Read back out
   * of the public config endpoint as `storefront_display`; see StorefrontDisplaySettings.
   */
  storefront_display?: {
    sku_display?: 'hidden' | 'plain' | 'full'
    stock_display?: 'hidden' | 'status' | 'low_only' | 'exact'
    out_of_stock_policy?: 'hide' | 'show' | 'notify' | 'backorder'
  }
}

export type WorkspaceSettings = {
  id: number
  /** FK to Workspace; required for admin UI to PATCH workspace name/slug */
  workspace_id?: number
  site_name?: string
  site_description?: string
  logo?: string
  support_email?: string
  custom_settings?: {
    invoice?: InvoiceSettingsPayload
    delivery?: DeliverySettingsPayload
    marketing?: MarketingSettingsPayload
    web?: WebSettingsPayload
    general?: GeneralSettingsPayload
    storefront_ui?: StorefrontUiSettingsPayload
    shop?: ShopSettingsPayload
    analytics?: AnalyticsSettingsPayload
    support?: { notice?: string }
    plugins?: PluginsSettingsPayload
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

export type SupportSettingsPayload = {
  support_email?: string
  /** Notice shown on account support page (response time & contact info). Stored in custom_settings.support.notice */
  support_notice?: string
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
  /**
   * The logo drawn on dark surfaces — a dark-ink wordmark vanishes on the
   * storefront's dark header and its always-dark footer. Same shape as `logo`.
   * Blank means "use `logo` everywhere", which is what every existing workspace
   * gets until someone uploads one.
   */
  logo_dark?: string
  /** Browser tab icon. Same shape as `logo` — a data URL when uploaded here. */
  favicon?: string
  /**
   * Print the site name next to the logo. Default false: a logo usually
   * contains the wordmark, so showing both duplicates the brand. Has no effect
   * when no logo is set.
   */
  show_site_name_with_logo?: boolean
  /** Optional internal note (e.g. from site-config workspace_bootstrap) */
  workspace_note?: string
}

export type WorkspaceRecord = {
  id: number
  name: string
  slug: string
  is_active?: boolean
}

/** Coalesces concurrent GET /workspaces/{id}/ (layout + settings page + header all call fetchWorkspaceRecord on load). */
let workspaceRecordInFlight: Promise<WorkspaceRecord> | null = null

export function invalidateWorkspaceRecordCache(): void {
  workspaceRecordInFlight = null
}

export async function fetchWorkspaceRecord(): Promise<WorkspaceRecord | null> {
  const requestHost = getSiteAdminRequestHost()
  if (!requestHost) return null
  const settings = await getWorkspaceSettings()
  const id = settings.workspace_id
  if (!id) return null

  if (!workspaceRecordInFlight) {
    workspaceRecordInFlight = apiFetch<WorkspaceRecord>(`${bfgApi.workspaces()}${id}/`, getSiteAdminOptions()).finally(
      () => {
        workspaceRecordInFlight = null
      }
    )
  }
  return workspaceRecordInFlight
}

export async function patchWorkspaceRecord(
  id: number,
  data: Partial<Pick<WorkspaceRecord, 'name' | 'slug'>>
): Promise<WorkspaceRecord> {
  const result = await apiFetch<WorkspaceRecord>(`${bfgApi.workspaces()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
  invalidateWorkspaceRecordCache()
  return result
}

export type PluginsSettingsPayload = {
  product_scanner?: {
    enabled?: boolean
    api_key?: string
    api_url?: string
  }
  /**
   * Google-backed address suggestions and reverse geocoding, served by the
   * server's `apps.geo` (`/api/v1/geo/`). No API key here on purpose — it is a
   * billed server credential and `custom_settings` is returned whole to anyone
   * who can read this endpoint, so it lives in the server's environment instead.
   */
  address_lookup?: {
    enabled?: boolean
    /** ISO 3166-1 alpha-2. Blank falls back to the workspace's own market. */
    country_code?: string
  }
}

let workspaceSettingsCache: Promise<WorkspaceSettings> | null = null

export function invalidateWorkspaceSettingsCache(): void {
  workspaceSettingsCache = null
}

export async function getWorkspaceSettings(): Promise<WorkspaceSettings> {
  if (workspaceSettingsCache) {
    return workspaceSettingsCache
  }
  const url = bfgApi.settings()
  const requestOptions = getSiteAdminOptions()
  const promise = (async () => {
    const res = await apiFetch<WorkspaceSettings | WorkspaceSettings[] | { results: WorkspaceSettings[] }>(url, requestOptions)
    
    // Handle paginated response
    if (res && typeof res === 'object' && 'results' in res) {
      const results = (res as { results: WorkspaceSettings[] }).results
      if (results.length === 0) {
        throw new Error('No workspace settings found. Please create settings first.')
      }
      return results[0]
    }
    
    if (Array.isArray(res)) {
      if (res.length === 0) {
        throw new Error('No workspace settings found. Please create settings first.')
      }
      return res[0]
    }
    
    if (res && typeof res === 'object') {
      return res as WorkspaceSettings
    }
    
    throw new Error('Invalid settings response format: ' + JSON.stringify(res))
  })()
  workspaceSettingsCache = promise
  promise.catch(() => { workspaceSettingsCache = null })
  return promise
}

export async function updateInvoiceSettings(settingsId: number, invoice: InvoiceSettingsPayload) {
  // PATCH custom_settings.invoice only, preserving other custom_settings
  const current = await apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, getSiteAdminOptions())
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, invoice }

  return apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateDeliverySettings(settingsId: number, delivery: DeliverySettingsPayload) {
  // PATCH custom_settings.delivery only, preserving other custom_settings
  const current = await apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, getSiteAdminOptions())
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, delivery }

  return apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateMarketingSettings(settingsId: number, marketing: MarketingSettingsPayload) {
  // PATCH custom_settings.marketing only, preserving other custom_settings
  const current = await apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, getSiteAdminOptions())
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, marketing }

  return apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateSupportSettings(settingsId: number, payload: SupportSettingsPayload) {
  const { support_notice, ...rest } = payload
  const body: Record<string, unknown> = { ...rest }
  if (support_notice !== undefined) {
    const current = await apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, getSiteAdminOptions())
    const custom = current.custom_settings || {}
    const support = (custom.support && typeof custom.support === 'object') ? { ...custom.support } : {}
    body.custom_settings = { ...custom, support: { ...support, notice: support_notice } }
  }
  return apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export async function updateWebSettings(settingsId: number, web: WebSettingsPayload) {
  // PATCH custom_settings.web only, preserving other custom_settings
  const current = await apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, getSiteAdminOptions())
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, web }

  return apiFetch<WorkspaceSettings>(`${bfgApi.settings()}${settingsId}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateGeneralSettings(settingsId: number, general: GeneralSettingsPayload) {
  // PATCH custom_settings.general only, preserving other custom_settings
  const url = `${bfgApi.settings()}${settingsId}/`
  const current = await apiFetch<WorkspaceSettings>(url, getSiteAdminOptions())
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, general }
  const result = await apiFetch<WorkspaceSettings>(url, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
  invalidateWorkspaceSettingsCache()
  return result
}

export async function updateStorefrontUiSettings(settingsId: number, storefront_ui: StorefrontUiSettingsPayload) {
  const url = `${bfgApi.settings()}${settingsId}/`
  const current = await apiFetch<WorkspaceSettings>(url, getSiteAdminOptions())
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, storefront_ui }
  return apiFetch<WorkspaceSettings>(url, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
}

export async function updateAnalyticsSettings(settingsId: number, analytics: AnalyticsSettingsPayload) {
  const url = `${bfgApi.settings()}${settingsId}/`
  const current = await apiFetch<WorkspaceSettings>(url, getSiteAdminOptions())
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, analytics }
  const result = await apiFetch<WorkspaceSettings>(url, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
  invalidateWorkspaceSettingsCache()
  return result
}

/**
 * Merge a partial shop settings payload into `custom_settings.shop`.
 *
 * Merges rather than replaces because two admin screens write this node and neither sends
 * all of it: General owns `review_moderation_required`, Store owns `storefront_display`,
 * and both send `product_identifiers`. Replacing meant whichever page saved last erased
 * the other's field — set an out-of-stock policy in Store, save General, and it was gone.
 *
 * The merge is one level deep, so a nested node passed in is replaced whole. Both callers
 * send those complete.
 */
export async function updateShopSettings(settingsId: number, shop: ShopSettingsPayload) {
  const url = `${bfgApi.settings()}${settingsId}/`
  const current = await apiFetch<WorkspaceSettings>(url, getSiteAdminOptions())
  const currentCustom = current.custom_settings || {}
  const nextCustom = { ...currentCustom, shop: { ...(currentCustom.shop || {}), ...shop } }
  const result = await apiFetch<WorkspaceSettings>(url, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
  invalidateWorkspaceSettingsCache()
  return result
}

export async function updatePluginsSettings(settingsId: number, plugins: PluginsSettingsPayload) {
  const url = `${bfgApi.settings()}${settingsId}/`
  const current = await apiFetch<WorkspaceSettings>(url, getSiteAdminOptions())
  const currentCustom = current.custom_settings || {}
  // Merge one plugin at a time. Each plugin's tab only knows about its own keys,
  // so replacing the whole `plugins` node would have the General tab's save wipe
  // whatever the Store tab had configured, and the other way round.
  const nextCustom = { ...currentCustom, plugins: { ...(currentCustom.plugins || {}), ...plugins } }
  const result = await apiFetch<WorkspaceSettings>(url, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({ custom_settings: nextCustom })
  })
  invalidateWorkspaceSettingsCache()
  return result
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

// ── API Keys management ──────────────────────────────────────────

export type APIKey = {
  id: number
  name: string
  prefix: string
  is_active: boolean
  created_by?: number
  created_by_name?: string
  last_used_at?: string
  expires_at?: string
  created_at?: string
  updated_at?: string
}

export type APIKeyCreateResponse = {
  id: number
  name: string
  api_key: string    // prefix
  api_secret: string // one-time plain text secret
  expires_at?: string
  created_at?: string
}

export async function getAPIKeys(): Promise<APIKey[]> {
  const res = await apiFetch<{ results: APIKey[] } | APIKey[]>(bfgApi.apiKeys())
  if ('results' in res) {
    return res.results
  }
  return res
}

export async function getAPIKey(id: number): Promise<APIKey> {
  return apiFetch<APIKey>(`${bfgApi.apiKeys()}${id}/`)
}

export async function createAPIKey(data: { name: string; expires_at?: string }): Promise<APIKeyCreateResponse> {
  return apiFetch<APIKeyCreateResponse>(bfgApi.apiKeys(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateAPIKey(id: number, data: Partial<APIKey>): Promise<APIKey> {
  return apiFetch<APIKey>(`${bfgApi.apiKeys()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteAPIKey(id: number): Promise<void> {
  await apiFetch<void>(`${bfgApi.apiKeys()}${id}/`, {
    method: 'DELETE'
  })
}

export async function regenerateAPIKey(id: number): Promise<APIKeyCreateResponse> {
  return apiFetch<APIKeyCreateResponse>(`${bfgApi.apiKeys()}${id}/regenerate/`, {
    method: 'POST'
  })
}
