/**
 * Storefront API Client
 *
 * Client for calling storefront API endpoints (/api/store/)
 */

import { refreshTokenIfNeeded } from './tokenRefresh'
import { getApiBaseUrl, getWorkspaceId } from './api'
import { getApiLanguageHeaders } from '@/i18n/http'

interface ApiResponse<T> {
  data?: T
  results?: T[]
  count?: number
  next?: string | null
  previous?: string | null
  error?: string
}

/** Storefront promo API: GET /api/store/promo/?context=home (CampaignDisplay slides, etc.) */
export interface StorefrontPromoSlide {
  id: number
  title?: string
  subtitle?: string
  image: string | null
  link_url: string
  order: number
}

export interface StorefrontPromoFeaturedCategory {
  id: number
  display_type?: 'category_entry' | 'featured'
  title?: string
  /** Display-level image (per tile); use this for category_entry so each tile has its own image */
  image?: string | null
  category: { id: number; name: string; slug: string; image: string | null }
  link_url?: string
  order: number
}

export interface StorefrontPromoResponse {
  context: string
  available: {
    slides?: StorefrontPromoSlide[]
    featured_categories?: StorefrontPromoFeaturedCategory[]
    flash_sales?: unknown[]
    group_buys?: unknown[]
  }
  types_present: string[]
}

class StorefrontApiClient {
  private _baseUrl?: string
  private _customBaseUrl?: string

  constructor(baseUrl?: string) {
    this._customBaseUrl = baseUrl
  }

  private get baseUrl(): string {
    if (this._baseUrl) {
      return this._baseUrl
    }
    this._baseUrl = this._customBaseUrl || getApiBaseUrl()
    return this._baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retryOn401: boolean = true): Promise<T> {
    const base = this.baseUrl.replace(/\/$/, '')
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${base}${path}`

    // Debug logging
    console.log('[storefrontApi] Request:', {
      method: options.method || 'GET',
      url,
      baseUrl: this.baseUrl,
      endpoint
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getApiLanguageHeaders(),
      ...(options.headers as Record<string, string> || {})
    }
    const workspaceId = getWorkspaceId()
    if (workspaceId) headers['X-Workspace-ID'] = workspaceId

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
        console.log('[storefrontApi] Auth token present:', token.substring(0, 20) + '...')
      } else {
        console.log('[storefrontApi] No auth token found')
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Include cookies for session support
    })

    console.log('[storefrontApi] Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      ok: response.ok
    })

    // Handle 401 Unauthorized or 403 Forbidden - try to refresh token and retry
    // Both can indicate an expired token
    if ((response.status === 401 || response.status === 403) && retryOn401) {
      const newToken = await refreshTokenIfNeeded()
      if (newToken) {
        // Create new options without old Authorization header to use new token
        const newOptions = { ...options }
        if (newOptions.headers) {
          const { Authorization, ...restHeaders } = newOptions.headers as Record<string, string>
          newOptions.headers = restHeaders
        }
        // Retry the request with new token
        return this.request<T>(endpoint, newOptions, false) // Don't retry again if it fails
      }
      // If refresh failed, fall through to error handling
    }

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')

    if (!response.ok) {
      let errorDetail = 'Request failed'
      let errorData: any = {}

      try {
        // Clone response to read body without consuming it
        const responseClone = response.clone()
        
        if (isJson) {
          const jsonData = await responseClone.json()
          errorData = jsonData || {}
          
          // Extract error message from various possible fields
          errorDetail =
            errorData.detail ||
            errorData.message ||
            errorData.error ||
            errorData.title ||
            (Array.isArray(errorData) && errorData.length > 0 && errorData[0]?.message) ||
            (typeof errorData === 'object' && Object.keys(errorData).length === 0 
              ? `HTTP error! status: ${response.status} ${response.statusText || ''}`.trim()
              : `HTTP error! status: ${response.status}`)
        } else {
          // Try to get text response (might be HTML error page)
          const text = await responseClone.text()
          // If it's HTML, provide a more helpful error message
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            errorDetail = `Server returned HTML instead of JSON. This usually means the endpoint doesn't exist (404) or there's a server error (500). Status: ${response.status}`
            errorData = { htmlResponse: true, status: response.status }
          } else if (text.trim()) {
            errorDetail = text || `HTTP error! status: ${response.status} ${response.statusText}`
            errorData = { message: text.substring(0, 200) } // Limit content in error data
          } else {
            // Empty response body
            errorDetail = `HTTP error! status: ${response.status} ${response.statusText || 'Unknown error'}`
            errorData = { status: response.status, statusText: response.statusText, emptyBody: true }
          }
        }
      } catch (e) {
        // If all parsing fails, use status text
        errorDetail = `HTTP error! status: ${response.status} ${response.statusText || 'Unknown error'}`
        errorData = { 
          status: response.status, 
          statusText: response.statusText, 
          parseError: String(e),
          parseErrorName: (e as Error)?.name || 'Unknown'
        }
      }

      // Handle 401 after refresh attempt - redirect to login
      if (response.status === 401 && typeof window !== 'undefined') {
        const { pathname, href } = window.location
        const isLogin = pathname.startsWith('/auth/login')
        if (!isLogin) {
          const redirect = encodeURIComponent(href)
          window.location.href = `/auth/login?redirect=${redirect}`
        }
      }

      // Redirect to login on 403 for account pages only (avoid redirect loops)
      if (response.status === 403 && typeof window !== 'undefined') {
        const { pathname, href } = window.location
        const isLogin = pathname.startsWith('/auth/login')
        const isAccountPage = pathname.startsWith('/account')
        if (isAccountPage && !isLogin) {
          const redirect = encodeURIComponent(href)
          window.location.href = `/auth/login?redirect=${redirect}`
        }
      }

      // Ensure we have a meaningful error message
      if (!errorDetail || errorDetail === 'Request failed') {
        errorDetail = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
      }

      const error = new Error(errorDetail)
      // Add additional error info
      ;(error as any).status = response.status
      ;(error as any).statusText = response.statusText
      ;(error as any).data = errorData
      ;(error as any).url = url

      // Build comprehensive error log
      const errorLog: any = {
        url,
        method: options.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        error: errorDetail,
        contentType
      }
      
      // Only include errorData if it has meaningful content
      if (errorData && Object.keys(errorData).length > 0) {
        errorLog.errorData = errorData
      }
      
      // Include request body if available (for debugging)
      if (options.body) {
        try {
          errorLog.requestBody = JSON.parse(options.body as string)
        } catch {
          errorLog.requestBody = options.body
        }
      }
      
      console.error('API Request failed:', errorLog)
      throw error
    }

    // Handle successful response - check if it's JSON before parsing
    if (isJson) {
      return response.json()
    } else {
      // If response is not JSON, try to parse as text or return empty object
      const text = await response.text()
      // If it's HTML, this is unexpected for a successful response
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error('Unexpected HTML response for successful request:', {
          url,
          status: response.status,
          text: text.substring(0, 200)
        })
        throw new Error(
          `Server returned HTML instead of JSON. Status: ${response.status}. This usually means the endpoint doesn't exist or there's a routing issue.`
        )
      }
      // Try to parse as JSON anyway (in case content-type is wrong)
      try {
        return JSON.parse(text)
      } catch (e) {
        // If parsing fails, return the text as-is (for non-JSON responses)
        return text as T
      }
    }
  }

  // Products
  async getProducts(params?: {
    q?: string
    category?: string
    tag?: string
    featured?: boolean
    is_new?: boolean
    bestseller?: boolean
    min_price?: number
    max_price?: number
    sort?: 'price_asc' | 'price_desc' | 'name' | 'sales'
    limit?: number
    page?: number
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()

    if (params?.q) queryParams.append('q', params.q)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.tag) queryParams.append('tag', params.tag)
    if (params?.featured) queryParams.append('featured', 'true')
    if (params?.is_new) queryParams.append('is_new', 'true')
    if (params?.bestseller) queryParams.append('bestseller', 'true')
    if (params?.min_price) queryParams.append('min_price', params.min_price.toString())
    if (params?.max_price) queryParams.append('max_price', params.max_price.toString())
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.page) queryParams.append('page', params.page.toString())

    const query = queryParams.toString()
    return this.request<ApiResponse<any>>(`/api/store/products/${query ? `?${query}` : ''}`)
  }

  async getProduct(idOrSlug: string | number): Promise<any> {
    return this.request<any>(`/api/store/products/${idOrSlug}/`)
  }

  async getProductReviews(
    productIdOrSlug: string | number,
    params?: {
      rating?: number
    }
  ): Promise<any[]> {
    const queryParams = new URLSearchParams()
    if (params?.rating) queryParams.append('rating', params.rating.toString())

    const query = queryParams.toString()
    return this.request<any[]>(`/api/store/products/${productIdOrSlug}/reviews/${query ? `?${query}` : ''}`)
  }

  async createProductReview(
    productIdOrSlug: string | number,
    data: {
      rating: number
      title?: string
      comment: string
      images?: string[]
    }
  ): Promise<any> {
    return this.request<any>(`/api/store/products/${productIdOrSlug}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Categories
  async getCategories(params?: { tree?: boolean }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.tree) queryParams.append('tree', 'true')

    const query = queryParams.toString()
    return this.request<ApiResponse<any>>(`/api/store/categories/${query ? `?${query}` : ''}`)
  }

  async getCategory(id: number): Promise<any> {
    return this.request<any>(`/api/store/categories/${id}/`)
  }

  /** Promo data for homepage (CampaignDisplay slides, featured_categories, flash_sales, group_buys). */
  async getPromo(context: string = 'home'): Promise<StorefrontPromoResponse> {
    return this.request<StorefrontPromoResponse>(`/api/store/promo/?context=${encodeURIComponent(context)}`)
  }

  // Cart
  async getCart(): Promise<any> {
    return this.request<any>('/api/store/cart/current/')
  }

  async getCartPreview(shippingMethod?: string, freightServiceId?: number): Promise<{
    subtotal: string
    discount: string
    shipping_cost: string
    tax: string
    total: string
    shipping_discount?: string | null
  }> {
    const queryParams = new URLSearchParams()
    if (freightServiceId) {
      queryParams.append('freight_service_id', freightServiceId.toString())
    } else if (shippingMethod) {
      queryParams.append('shipping_method', shippingMethod)
    }
    const query = queryParams.toString()
    return this.request<{
      subtotal: string
      discount: string
      shipping_cost: string
      tax: string
      total: string
      shipping_discount?: string | null
    }>(`/api/store/cart/preview/${query ? `?${query}` : ''}`)
  }

  // Freight Services
  async getFreightServicesForCountry(country: string): Promise<any[]> {
    return this.request<any[]>(`/api/v1/freight-services/for_country/?country=${encodeURIComponent(country)}`)
  }

  async addCartItem(data: { product: number; variant?: number; quantity: number }): Promise<any> {
    // Only include variant if it's provided
    const requestData: any = {
      product: data.product,
      quantity: data.quantity
    }
    if (data.variant !== undefined) {
      requestData.variant = data.variant
    }

    return this.request<any>('/api/store/cart/add_item/', {
      method: 'POST',
      body: JSON.stringify(requestData)
    })
  }

  async updateCartItem(data: { item_id: number; quantity: number }): Promise<any> {
    return this.request<any>('/api/store/cart/update_item/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async removeCartItem(data: { item_id: number }): Promise<any> {
    return this.request<any>('/api/store/cart/remove_item/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async clearCart(): Promise<any> {
    return this.request<any>('/api/store/cart/clear/', {
      method: 'POST'
    })
  }

  async getDefaultStore(): Promise<{ id: number; name: string; code: string }> {
    return this.request<{ id: number; name: string; code: string }>('/api/store/cart/default_store/')
  }

  async checkout(data: {
    store: number
    shipping_address: number
    billing_address: number
    customer_note?: string
    freight_service_id?: number  // Preferred
    shipping_method?: string  // Backward compatibility
    shipping_cost?: number  // Backward compatibility
    tax?: number  // Backward compatibility
  }): Promise<any> {
    return this.request<any>('/api/store/cart/checkout/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Guest checkout (no authentication required)
  async guestCheckout(data: {
    store: number
    shipping_address: {
      full_name: string
      phone?: string
      email?: string
      address_line1: string
      address_line2?: string
      city: string
      state?: string
      postal_code: string
      country: string
    }
    billing_same_as_shipping?: boolean
    billing_address?: {
      full_name: string
      phone?: string
      email?: string
      address_line1: string
      address_line2?: string
      city: string
      state?: string
      postal_code: string
      country: string
    }
    customer_note?: string
    email?: string
    full_name?: string
    phone?: string
    freight_service_id?: number  // Preferred
    shipping_method?: string  // Backward compatibility
  }): Promise<any> {
    return this.request<any>('/api/store/cart/guest_checkout/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Addresses
  async getAddresses(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/store/addresses/')
  }

  async getDefaultAddress(): Promise<any> {
    return this.request<any>('/api/store/addresses/default/')
  }

  async createAddress(data: {
    full_name: string
    phone: string
    email?: string
    address_line1: string
    address_line2?: string
    city: string
    state?: string
    postal_code: string
    country: string
    is_default?: boolean
  }): Promise<any> {
    return this.request<any>('/api/store/addresses/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateAddress(
    id: number,
    data: Partial<{
      full_name: string
      phone: string
      email: string
      address_line1: string
      address_line2: string
      city: string
      state: string
      postal_code: string
      country: string
      is_default: boolean
    }>
  ): Promise<any> {
    return this.request<any>(`/api/store/addresses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteAddress(id: number): Promise<void> {
    return this.request<void>(`/api/store/addresses/${id}/`, {
      method: 'DELETE'
    })
  }

  // Orders
  async getOrders(params?: { status?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)

    const query = queryParams.toString()
    return this.request<ApiResponse<any>>(`/api/store/orders/${query ? `?${query}` : ''}`)
  }

  async getOrder(id: number): Promise<any> {
    return this.request<any>(`/api/store/orders/${id}/`)
  }

  async cancelOrder(
    id: number,
    data: {
      reason?: string
    }
  ): Promise<any> {
    return this.request<any>(`/api/store/orders/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Payments
  async getPaymentGateways(): Promise<any[]> {
    return this.request<any[]>('/api/store/payments/gateways/')
  }
  
  async createPaymentIntent(data: { 
    order_id: number
    gateway_id: number
    payment_method_id?: number
    customer_id?: number
    save_card?: boolean
  }): Promise<any> {
    return this.request<any>('/api/store/payments/intent/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async processPayment(id: number): Promise<any> {
    return this.request<any>(`/api/store/payments/${id}/process/`, {
      method: 'POST'
    })
  }
}

export const storefrontApi = new StorefrontApiClient()
