// API configuration and client utilities

import { refreshTokenIfNeeded } from './tokenRefresh'
import { getApiLanguageHeaders } from '@/i18n/http'
import { getWorkspaceApiBaseUrlFromEnv } from './apiUrls'
import { getWorkspaceToken } from './authTokens'

/**
 * Get API base URL from environment variable.
 * On server (SSR): use API_URL when set (e.g. Docker internal http://server:8000), else NEXT_PUBLIC_API_URL.
 * In browser: use NEXT_PUBLIC_API_URL only.
 */
export function getApiBaseUrl(): string {
  return getWorkspaceApiBaseUrlFromEnv()
}

/**
 * Alias for getApiBaseUrl for convenience
 */
export const getApiUrl = getApiBaseUrl

/**
 * Public site base URL for absolute links (OG, canonical, JSON-LD).
 * Prefer NEXT_PUBLIC_SITE_URL; fallback to Vercel URL when deployed.
 */
export function getSiteBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return ''
}

// API version configuration
export const API_VERSIONS = {
  BFG2: 'v1'
} as const

/** Response shape for GET /api/v1/system/version/ */
export type ServerVersionResponse = {
  api_version: string
  schema_version: string
  bfg_version: string
  build_id?: string
}

/**
 * Build API URL with version prefix
 */
export function buildApiUrl(
  path: string,
  version: 'v1' | 'v2' | '' = 'v1',
  module?: string
): string {
  const base = getApiBaseUrl().replace(/\/+$/, '')
  const basePath = version ? `/api/${version}` : '/api'
  const modulePath = module ? `/${module}` : ''
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  return `${base}${basePath}${modulePath}${cleanPath}`
}

/**
 * BFG API endpoints (v1)
 */
export const bfgApi = {
  // System (public)
  serverVersion: () => buildApiUrl('/system/version/', API_VERSIONS.BFG2),

  // Common
  workspaces: () => buildApiUrl('/workspaces/', API_VERSIONS.BFG2),
  customers: () => buildApiUrl('/customers/', API_VERSIONS.BFG2),
  addresses: () => buildApiUrl('/addresses/', API_VERSIONS.BFG2),
  settings: () => buildApiUrl('/settings/', API_VERSIONS.BFG2),
  emailConfigs: () => buildApiUrl('/email-configs/', API_VERSIONS.BFG2),
  users: () => buildApiUrl('/users/', API_VERSIONS.BFG2),
  staffRoles: () => buildApiUrl('/staff-roles/', API_VERSIONS.BFG2),
  apiKeys: () => buildApiUrl('/api-keys/', API_VERSIONS.BFG2),

  // Web/CMS
  sites: () => buildApiUrl('/web/sites/', API_VERSIONS.BFG2),
  themes: () => buildApiUrl('/web/themes/', API_VERSIONS.BFG2),
  languages: () => buildApiUrl('/web/languages/', API_VERSIONS.BFG2),
  pages: () => buildApiUrl('/web/pages/', API_VERSIONS.BFG2),
  posts: () => buildApiUrl('/web/posts/', API_VERSIONS.BFG2),
  categories: () => buildApiUrl('/web/categories/', API_VERSIONS.BFG2),
  tags: () => buildApiUrl('/web/tags/', API_VERSIONS.BFG2),
  menus: () => buildApiUrl('/web/menus/', API_VERSIONS.BFG2),
  media: () => buildApiUrl('/web/media/', API_VERSIONS.BFG2),
  inquiries: () => buildApiUrl('/web/inquiries/', API_VERSIONS.BFG2),
  feedback: () => buildApiUrl('/web/feedback/', API_VERSIONS.BFG2),
  newsletterSubscriptions: () => buildApiUrl('/web/newsletter-subscriptions/', API_VERSIONS.BFG2),
  newsletterTemplates: () => buildApiUrl('/web/newsletter-templates/', API_VERSIONS.BFG2),
  newsletterSends: () => buildApiUrl('/web/newsletter-sends/', API_VERSIONS.BFG2),
  newsletterSendLogs: () => buildApiUrl('/web/newsletter-send-logs/', API_VERSIONS.BFG2),
  blockTypes: () => buildApiUrl('/web/blocks/types/', API_VERSIONS.BFG2),
  categoryTemplates: () => buildApiUrl('/web/categories/templates/', API_VERSIONS.BFG2),
  timeslots: () => buildApiUrl('/web/timeslots/', API_VERSIONS.BFG2),
  bookings: () => buildApiUrl('/web/bookings/', API_VERSIONS.BFG2),

  // Shop
  stores: () => buildApiUrl('/stores/', API_VERSIONS.BFG2, 'shop'),
  salesChannels: () => buildApiUrl('/sales-channels/', API_VERSIONS.BFG2, 'shop'),
  subscriptionPlans: () => buildApiUrl('/subscription-plans/', API_VERSIONS.BFG2, 'shop'),
  products: () => buildApiUrl('/products/', API_VERSIONS.BFG2, 'shop'),
  productCategoryRulesSchema: () => buildApiUrl('/categories/rules_schema/', API_VERSIONS.BFG2, 'shop'),
  productMedia: () => buildApiUrl('/product-media/', API_VERSIONS.BFG2, 'shop'),
  variants: () => buildApiUrl('/variants/', API_VERSIONS.BFG2, 'shop'),
  orders: () => buildApiUrl('/orders/', API_VERSIONS.BFG2, 'shop'),
  reviews: () => buildApiUrl('/reviews/', API_VERSIONS.BFG2, 'shop'),
  wishlists: () => buildApiUrl('/wishlists/', API_VERSIONS.BFG2, 'shop'),
  cart: {
    current: () => buildApiUrl('/cart/current/', API_VERSIONS.BFG2, 'shop'),
    addItem: () => buildApiUrl('/cart/add_item/', API_VERSIONS.BFG2, 'shop'),
    checkout: () => buildApiUrl('/cart/checkout/', API_VERSIONS.BFG2, 'shop')
  },

  // Delivery
  warehouses: () => buildApiUrl('/warehouses/', API_VERSIONS.BFG2, 'delivery'),
  consignments: () => buildApiUrl('/consignments/', API_VERSIONS.BFG2, 'delivery'),
  carriers: () => buildApiUrl('/carriers/', API_VERSIONS.BFG2, 'delivery'),
  packagingTypes: () => buildApiUrl('/packaging-types/', API_VERSIONS.BFG2, 'delivery'),
  freightServices: () => buildApiUrl('/freight-services/', API_VERSIONS.BFG2, 'delivery'),
  freightServiceConfigSchema: (templateId?: string) =>
    buildApiUrl('/freight-services/config_schema/', API_VERSIONS.BFG2, 'delivery') + (templateId ? `?template=${encodeURIComponent(templateId)}` : ''),
  freightServiceTemplates: () => buildApiUrl('/freight-services/templates/', API_VERSIONS.BFG2, 'delivery'),
  freightStatuses: () => buildApiUrl('/freight-statuses/', API_VERSIONS.BFG2, 'delivery'),
  deliveryZones: () => buildApiUrl('/delivery-zones/', API_VERSIONS.BFG2, 'delivery'),
  trackingEvents: () => buildApiUrl('/tracking-events/', API_VERSIONS.BFG2, 'delivery'),

  // Support
  tickets: () => buildApiUrl('/support/tickets/', API_VERSIONS.BFG2),
  ticket: (id: string | number) => buildApiUrl(`/support/tickets/${id}/`, API_VERSIONS.BFG2),
  ticketMessages: (id: string | number) => buildApiUrl(`/support/tickets/${id}/messages/`, API_VERSIONS.BFG2),
  supportOptions: () => buildApiUrl('/support/options/', API_VERSIONS.BFG2),
  ticketCategories: () => buildApiUrl('/support/ticket-categories/', API_VERSIONS.BFG2),
  ticketCategory: (id: string | number) => buildApiUrl(`/support/ticket-categories/${id}/`, API_VERSIONS.BFG2),
  ticketPriorities: () => buildApiUrl('/support/ticket-priorities/', API_VERSIONS.BFG2),
  ticketPriority: (id: string | number) => buildApiUrl(`/support/ticket-priorities/${id}/`, API_VERSIONS.BFG2),

  // Finance
  invoices: () => buildApiUrl('/invoices/', API_VERSIONS.BFG2, 'finance'),
  brands: () => buildApiUrl('/brands/', API_VERSIONS.BFG2, 'finance'),
  currencies: () => buildApiUrl('/currencies/', API_VERSIONS.BFG2, 'finance'),
  financialCodes: () => buildApiUrl('/financial-codes/', API_VERSIONS.BFG2, 'finance'),
  payments: () => buildApiUrl('/payments/', API_VERSIONS.BFG2, 'finance'),
  paymentMethods: () => buildApiUrl('/payment-methods/', API_VERSIONS.BFG2, 'finance'),
  paymentGateways: () => buildApiUrl('/payment-gateways/', API_VERSIONS.BFG2, 'finance'),
  paymentGatewayPlugins: () => buildApiUrl('/payment-gateways/plugins/', API_VERSIONS.BFG2, 'finance'),
  taxRates: () => buildApiUrl('/tax-rates/', API_VERSIONS.BFG2, 'finance'),
  invoiceSettings: () => buildApiUrl('/invoice-settings/', API_VERSIONS.BFG2, 'finance'),
  wallets: () => buildApiUrl('/wallets/', API_VERSIONS.BFG2, 'finance'),

  // Marketing
  campaigns: () => buildApiUrl('/campaigns/', API_VERSIONS.BFG2, 'marketing'),
  campaignDisplays: () => buildApiUrl('/campaign-displays/', API_VERSIONS.BFG2, 'marketing'),
  coupons: () => buildApiUrl('/coupons/', API_VERSIONS.BFG2, 'marketing'),
  giftCards: () => buildApiUrl('/gift-cards/', API_VERSIONS.BFG2, 'marketing'),
  referralPrograms: () => buildApiUrl('/referral-programs/', API_VERSIONS.BFG2, 'marketing'),
  discountRules: () => buildApiUrl('/discount-rules/', API_VERSIONS.BFG2, 'marketing'),

  // Inbox/Notifications
  messageTemplates: () => buildApiUrl('/inbox/templates/', API_VERSIONS.BFG2),
  messages: () => buildApiUrl('/inbox/messages/', API_VERSIONS.BFG2),
  recipients: () => buildApiUrl('/inbox/recipients/', API_VERSIONS.BFG2),

  // Agent (AI capabilities)
  agentCapabilities: (format?: 'openai_tools') =>
    buildApiUrl('/agent/capabilities/', API_VERSIONS.BFG2) + (format ? `?format=${encodeURIComponent(format)}` : ''),
  agentExecute: () => buildApiUrl('/agent/execute/', API_VERSIONS.BFG2),
  agentChat: () => buildApiUrl('/agent/chat/', API_VERSIONS.BFG2),
}

/**
 * Fetch running server version metadata (no auth).
 */
export async function fetchServerVersion(
  options?: Pick<ApiFetchOptions, 'requestHost' | 'siteAdminScope'>
): Promise<ServerVersionResponse> {
  return apiFetch<ServerVersionResponse>(bfgApi.serverVersion(), {
    ...options,
    withAuth: false
  })
}

/**
 * Get workspace auth token from partitioned storage (migrates legacy `auth_token` once).
 */
function getAuthToken(): string | null {
  return getWorkspaceToken()
}

/**
 * Workspace id for API headers: `localStorage.workspace_id` (if set), else `NEXT_PUBLIC_WORKSPACE_ID`.
 * When null, callers should pass `requestHost` so the backend can resolve the tenant by domain.
 * Storefront, account, and admin all use the same source so pinned dev tenants behave consistently.
 */
export function getWorkspaceId(): string | null {
  if (typeof window !== 'undefined') {
    // Always prefer localStorage override (set during token exchange from platform login)
    const workspaceId = localStorage.getItem('workspace_id')
    if (workspaceId) return workspaceId
    const envWorkspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID || null
    if (envWorkspaceId) return envWorkspaceId
  } else if (process.env.NEXT_PUBLIC_WORKSPACE_ID) {
    return process.env.NEXT_PUBLIC_WORKSPACE_ID
  }
  return null
}

/**
 * Read workspace_id from the JWT access token payload (for UI display).
 * The backend embeds workspace_id as a signed claim so this is authoritative
 * for the active tenant context without an extra API call.
 */
export function getWorkspaceIdFromJwt(): number | null {
  if (typeof window === 'undefined') return null
  const token = getWorkspaceToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (payload as { workspace_id?: number }).workspace_id ?? null
  } catch {
    return null
  }
}

export type GetApiHeadersOptions = {
  /** When set (e.g. request host for auth/storefront), backend can resolve workspace by domain. */
  requestHost?: string
  /** Attach Bearer token from storage when present (browser only). */
  withAuth?: boolean
  /**
   * Site-bound admin scope: send `X-Workspace-ID` when `getWorkspaceId()` is non-null
   * (`NEXT_PUBLIC_WORKSPACE_ID` or `localStorage.workspace_id`); otherwise rely on
   * `requestHost` / `X-Forwarded-Host` for domain-based tenant resolution.
   */
  siteAdminScope?: boolean
}

export type ApiFetchOptions = RequestInit & {
  requestHost?: string
  withAuth?: boolean
  siteAdminScope?: boolean
}

/**
 * Common headers for API requests (workspace, locale). Use for any direct fetch to backend.
 * Pass requestHost for auth/storefront so backend resolves workspace by domain when X-Workspace-ID is not set.
 */
export function getApiHeaders(
  overrides?: Record<string, string>,
  options?: GetApiHeadersOptions
): Record<string, string> {
  const headers: Record<string, string> = {
    ...getApiLanguageHeaders(),
  }
  const pinnedWorkspaceId = getWorkspaceId()
  const isAuthenticated = Boolean(options?.withAuth && getWorkspaceToken())
  const workspaceId = isAuthenticated && !pinnedWorkspaceId ? null : pinnedWorkspaceId
  if (workspaceId) {
    headers['X-Workspace-ID'] = workspaceId
  }
  const forwardedHost =
    options?.requestHost ??
    (typeof window !== 'undefined' && !workspaceId ? window.location.host : undefined)
  if (forwardedHost) {
    headers['X-Forwarded-Host'] = forwardedHost
  }
  if (options?.withAuth) {
    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  if (overrides) {
    Object.assign(headers, overrides)
  }
  return headers
}

/**
 * Redirect to login when on /admin and API returns 401 or 403.
 * /admin is not allowed for anonymous or customer; other users access by workspace permission.
 * Call only in browser; no-op on server.
 */
function redirectToLoginIfAdminUnauthorized(status: number): void {
  if (typeof window === 'undefined') return
  if (status !== 401 && status !== 403) return
  const pathname = window.location.pathname
  if (!pathname.startsWith('/admin')) return
  const href = window.location.href
  const redirect = encodeURIComponent(href)
  window.location.href = `/auth/login?redirect=${redirect}`
}

/**
 * Build request init (method, headers, body) for agent chat. Used by both JSON and SSE streaming.
 */
export function getAgentChatRequestInit(body: Record<string, unknown>): RequestInit {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    ...getApiLanguageHeaders(),
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    // Workspace resolved from JWT claim by backend; no X-Workspace-ID needed.
  } else {
    const workspaceId = getWorkspaceId()
    if (workspaceId) headers['X-Workspace-ID'] = workspaceId
    else if (typeof window !== 'undefined') {
      headers['X-Forwarded-Host'] = window.location.host
    }
  }
  return { method: 'POST', headers, body: JSON.stringify(body) }
}

/**
 * Generic API fetch function with error handling and automatic token refresh
 */
export async function apiFetch<T>(
  url: string,
  options?: ApiFetchOptions,
  retryOn401: boolean = true
): Promise<T> {
  const token = getAuthToken()
  const { requestHost, withAuth, siteAdminScope, ...fetchOptions } = options || {}
  void siteAdminScope
  const pinnedWorkspaceId = getWorkspaceId()
  const sendsAuth = Boolean(token && withAuth !== false)
  const workspaceId = sendsAuth && !pinnedWorkspaceId ? null : pinnedWorkspaceId
  const headers: Record<string, string> = {
    ...(fetchOptions?.headers as Record<string, string>)
  }

  // Add locale for backend i18n (Django LocaleMiddleware)
  Object.assign(headers, getApiLanguageHeaders())

  // Only set Content-Type for JSON, not for FormData
  if (!(fetchOptions?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Add auth token if available
  if (token && withAuth !== false) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Add workspace ID header if available (required for workspace-scoped endpoints)
  if (workspaceId) {
    headers['X-Workspace-ID'] = workspaceId
  }

  // Split-host production: browser is on preloved.kiwi but API is api.preloved.kiwi.
  // WorkspaceMiddleware resolves tenant from Host / X-Forwarded-Host via WorkspaceDomain.
  // When there is no X-Workspace-ID (no localStorage / env pin), send the site hostname so
  // the API can resolve workspace without trusting api.* as a tenant domain.
  const forwardedHost =
    requestHost ??
    (typeof window !== 'undefined' && !workspaceId ? window.location.host : undefined)
  if (forwardedHost) {
    headers['X-Forwarded-Host'] = forwardedHost
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers
  })

  // Handle 401 Unauthorized or 403 Forbidden - try to refresh token and retry once
  // Backend may return 403 when token is invalid (e.g. DRF IsAuthenticated)
  if ((response.status === 401 || response.status === 403) && retryOn401) {
    const newToken = await refreshTokenIfNeeded()
    if (newToken) {
      return apiFetch<T>(url, options, false)
    }
  }

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  if (!response.ok) {
    let errorDetail = 'Request failed'
    let errorData: Record<string, unknown> | null = null
    if (isJson) {
      try {
        const parsed = await response.json()
        errorData = parsed && typeof parsed === 'object' ? parsed : null
        errorDetail =
          (parsed?.detail as string) ||
          (parsed?.message as string) ||
          (parsed?.error as string) ||
          errorDetail
        // DRF validation errors: { "field": ["msg1", "msg2"] } -> show in message
        if (errorDetail === 'Request failed' && errorData && typeof errorData === 'object') {
          const parts: string[] = []
          for (const [key, val] of Object.entries(errorData)) {
            if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
              parts.push(`${key}: ${(val as string[]).join(', ')}`)
            } else if (typeof val === 'string') {
              parts.push(`${key}: ${val}`)
            }
          }
          if (parts.length) {
            errorDetail = parts.join('; ')
          }
        }
        if (errorDetail.includes('token') && errorDetail.includes('not valid')) {
          console.error('[apiFetch] Token validation error:', errorDetail)
        }
      } catch {
        errorDetail = response.statusText
      }
    } else {
      errorDetail = response.statusText
    }

    redirectToLoginIfAdminUnauthorized(response.status)

    const error = new Error(errorDetail)
    ;(error as any).status = response.status
    if (errorData) (error as any).validationErrors = errorData
    throw error
  }

  if (!isJson) {
    // For non-JSON responses, return the response object itself
    return response as unknown as T
  }

  try {
    const data = await response.json()
    return data
  } catch (error) {
    throw new Error('Failed to parse JSON response')
  }
}

