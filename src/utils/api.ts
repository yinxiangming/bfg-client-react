// API configuration and client utilities

import { refreshTokenIfNeeded } from './tokenRefresh'
import { getApiLanguageHeaders } from '@/i18n/http'

/**
 * Get API base URL from environment variable.
 * On server (SSR): use API_URL when set (e.g. Docker internal http://server:8000), else NEXT_PUBLIC_API_URL.
 * In browser: use NEXT_PUBLIC_API_URL only.
 */
export function getApiBaseUrl(): string {
  const serverUrl = typeof window === 'undefined' ? process.env.API_URL : undefined
  const apiBaseUrl = serverUrl || process.env.NEXT_PUBLIC_API_URL
  if (!apiBaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and set NEXT_PUBLIC_API_URL (e.g. your API base URL).'
    )
  }
  return apiBaseUrl
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
  // Common
  workspaces: () => buildApiUrl('/workspaces/', API_VERSIONS.BFG2),
  customers: () => buildApiUrl('/customers/', API_VERSIONS.BFG2),
  addresses: () => buildApiUrl('/addresses/', API_VERSIONS.BFG2),
  settings: () => buildApiUrl('/settings/', API_VERSIONS.BFG2),
  emailConfigs: () => buildApiUrl('/email-configs/', API_VERSIONS.BFG2),
  users: () => buildApiUrl('/users/', API_VERSIONS.BFG2),
  staffRoles: () => buildApiUrl('/staff-roles/', API_VERSIONS.BFG2),

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
  newsletterSubscriptions: () => buildApiUrl('/web/newsletter-subscriptions/', API_VERSIONS.BFG2),
  newsletterTemplates: () => buildApiUrl('/web/newsletter-templates/', API_VERSIONS.BFG2),
  newsletterSends: () => buildApiUrl('/web/newsletter-sends/', API_VERSIONS.BFG2),
  newsletterSendLogs: () => buildApiUrl('/web/newsletter-send-logs/', API_VERSIONS.BFG2),
  blockTypes: () => buildApiUrl('/web/blocks/types/', API_VERSIONS.BFG2),
  categoryTemplates: () => buildApiUrl('/web/categories/templates/', API_VERSIONS.BFG2),
  timeslots: () => buildApiUrl('/web/timeslots/', API_VERSIONS.BFG2),
  bookings: () => buildApiUrl('/web/bookings/', API_VERSIONS.BFG2),

  // Shop
  stores: () => buildApiUrl('/stores/', API_VERSIONS.BFG2),
  salesChannels: () => buildApiUrl('/sales-channels/', API_VERSIONS.BFG2),
  subscriptionPlans: () => buildApiUrl('/subscription-plans/', API_VERSIONS.BFG2),
  products: () => buildApiUrl('/products/', API_VERSIONS.BFG2),
  productCategoryRulesSchema: () => buildApiUrl('/categories/rules_schema/', API_VERSIONS.BFG2),
  productMedia: () => buildApiUrl('/product-media/', API_VERSIONS.BFG2),
  variants: () => buildApiUrl('/variants/', API_VERSIONS.BFG2),
  orders: () => buildApiUrl('/orders/', API_VERSIONS.BFG2),
  reviews: () => buildApiUrl('/reviews/', API_VERSIONS.BFG2),
  cart: {
    current: () => buildApiUrl('/cart/current/', API_VERSIONS.BFG2),
    addItem: () => buildApiUrl('/cart/add_item/', API_VERSIONS.BFG2),
    checkout: () => buildApiUrl('/cart/checkout/', API_VERSIONS.BFG2)
  },

  // Delivery
  warehouses: () => buildApiUrl('/warehouses/', API_VERSIONS.BFG2),
  consignments: () => buildApiUrl('/consignments/', API_VERSIONS.BFG2),
  carriers: () => buildApiUrl('/carriers/', API_VERSIONS.BFG2),
  packagingTypes: () => buildApiUrl('/packaging-types/', API_VERSIONS.BFG2),
  freightServices: () => buildApiUrl('/freight-services/', API_VERSIONS.BFG2),
  freightServiceConfigSchema: (templateId?: string) =>
    buildApiUrl('/freight-services/config_schema/', API_VERSIONS.BFG2) + (templateId ? `?template=${encodeURIComponent(templateId)}` : ''),
  freightServiceTemplates: () => buildApiUrl('/freight-services/templates/', API_VERSIONS.BFG2),
  freightStatuses: () => buildApiUrl('/freight-statuses/', API_VERSIONS.BFG2),
  deliveryZones: () => buildApiUrl('/delivery-zones/', API_VERSIONS.BFG2),
  trackingEvents: () => buildApiUrl('/tracking-events/', API_VERSIONS.BFG2),

  // Support
  tickets: () => buildApiUrl('/tickets/', API_VERSIONS.BFG2),
  ticket: (id: string | number) => buildApiUrl(`/tickets/${id}/`, API_VERSIONS.BFG2),

  // Finance
  invoices: () => buildApiUrl('/invoices/', API_VERSIONS.BFG2),
  brands: () => buildApiUrl('/brands/', API_VERSIONS.BFG2),
  currencies: () => buildApiUrl('/currencies/', API_VERSIONS.BFG2),
  financialCodes: () => buildApiUrl('/financial-codes/', API_VERSIONS.BFG2),
  payments: () => buildApiUrl('/payments/', API_VERSIONS.BFG2),
  paymentMethods: () => buildApiUrl('/payment-methods/', API_VERSIONS.BFG2),
  paymentGateways: () => buildApiUrl('/payment-gateways/', API_VERSIONS.BFG2),
  paymentGatewayPlugins: () => buildApiUrl('/payment-gateways/plugins/', API_VERSIONS.BFG2),
  taxRates: () => buildApiUrl('/tax-rates/', API_VERSIONS.BFG2),
  invoiceSettings: () => buildApiUrl('/invoice-settings/', API_VERSIONS.BFG2),
  wallets: () => buildApiUrl('/finance/wallets/', API_VERSIONS.BFG2),

  // Marketing
  campaigns: () => buildApiUrl('/campaigns/', API_VERSIONS.BFG2),
  campaignDisplays: () => buildApiUrl('/campaign-displays/', API_VERSIONS.BFG2),
  coupons: () => buildApiUrl('/coupons/', API_VERSIONS.BFG2),
  giftCards: () => buildApiUrl('/gift-cards/', API_VERSIONS.BFG2),
  referralPrograms: () => buildApiUrl('/referral-programs/', API_VERSIONS.BFG2),
  discountRules: () => buildApiUrl('/discount-rules/', API_VERSIONS.BFG2),

  // Inbox/Notifications
  messageTemplates: () => buildApiUrl('/inbox/templates/', API_VERSIONS.BFG2),
  messages: () => buildApiUrl('/inbox/messages/', API_VERSIONS.BFG2),
  recipients: () => buildApiUrl('/inbox/recipients/', API_VERSIONS.BFG2)
}

/**
 * Get auth token from storage
 */
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token')
  }
  return null
}

/**
 * Get workspace ID from storage or use default.
 * On server (SSR), uses NEXT_PUBLIC_WORKSPACE_ID so port-specific site (e.g. 3001) gets correct workspace.
 */
export function getWorkspaceId(): string | null {
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      return process.env.NEXT_PUBLIC_WORKSPACE_ID || '1'
    }
    const envWorkspaceId = process.env.NEXT_PUBLIC_WORKSPACE_ID || null
    const workspaceId = localStorage.getItem('workspace_id')
    if (workspaceId) {
      return workspaceId
    }
    if (envWorkspaceId) return envWorkspaceId
  } else if (process.env.NEXT_PUBLIC_WORKSPACE_ID) {
    return process.env.NEXT_PUBLIC_WORKSPACE_ID
  }
  return null
}

export type GetApiHeadersOptions = {
  /** When set (e.g. request host for auth/storefront), backend can resolve workspace by domain. */
  requestHost?: string
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
  const workspaceId = getWorkspaceId()
  if (workspaceId) {
    headers['X-Workspace-ID'] = workspaceId
  }
  if (options?.requestHost) {
    headers['X-Forwarded-Host'] = options.requestHost
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
 * Generic API fetch function with error handling and automatic token refresh
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
  retryOn401: boolean = true
): Promise<T> {
  const token = getAuthToken()
  const workspaceId = getWorkspaceId()
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>)
  }

  // Add locale for backend i18n (Django LocaleMiddleware)
  Object.assign(headers, getApiLanguageHeaders())

  // Only set Content-Type for JSON, not for FormData
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Add workspace ID header if available (required for workspace-scoped endpoints)
  if (workspaceId) {
    headers['X-Workspace-ID'] = workspaceId
  }

  const response = await fetch(url, {
    ...options,
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

