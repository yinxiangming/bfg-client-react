/**
 * User Account API Client
 *
 * Client for calling /api/v1/me endpoints
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

class MeApiClient {
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
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      ...getApiLanguageHeaders(),
      ...(options.headers as Record<string, string> || {})
    }
    const workspaceId = getWorkspaceId()
    if (workspaceId) headers['X-Workspace-ID'] = workspaceId

    // Only set Content-Type for non-FormData requests
    // For FormData, browser will automatically set Content-Type with boundary
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    // Add auth token if available (Bearer token authentication only for account module)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      console.log('meApi: Checking token in localStorage:', { hasToken: !!token, tokenLength: token?.length })
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
        console.log('meApi: Authorization header set:', { hasAuth: !!headers['Authorization'] })
      } else {
        console.warn('meApi: No auth_token found in localStorage. Request will likely fail with 401.')
      }
    }

    console.log('meApi: Making request:', {
      url,
      method: options.method || 'GET',
      hasAuthHeader: !!headers['Authorization']
    })

    const response = await fetch(url, {
      ...options,
      headers
      // Note: Using Bearer token authentication only for account module
    })

    console.log('meApi: Response received:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    // Handle 401 Unauthorized or 403 Forbidden - try to refresh token and retry
    // Both can indicate an expired token
    if ((response.status === 401 || response.status === 403) && retryOn401) {
      const newToken = await refreshTokenIfNeeded()
      if (newToken) {
        // Retry the request with new token
        return this.request<T>(endpoint, options, false) // Don't retry again if it fails
      }
      // If refresh failed, fall through to error handling
    }

    if (!response.ok) {
      let errorDetail = 'Request failed'
      let errorData: any = {}

      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      try {
        if (isJson) {
          try {
            errorData = await response.json()
            errorDetail =
              errorData.detail ||
              errorData.message ||
              errorData.error ||
              errorData.title ||
              `HTTP error! status: ${response.status}`
          } catch (jsonError) {
            // If JSON parsing fails, clone and try to get text
            try {
              const responseClone = response.clone()
              const text = await responseClone.text()
              errorDetail = text || `HTTP error! status: ${response.status} ${response.statusText}`
              errorData = { message: text, jsonParseError: String(jsonError) }
            } catch (cloneError) {
              errorDetail = `HTTP error! status: ${response.status} ${response.statusText}`
              errorData = { status: response.status, statusText: response.statusText }
            }
          }
        } else {
          const text = await response.text()
          errorDetail = text || `HTTP error! status: ${response.status} ${response.statusText}`
          errorData = { message: text }
        }
      } catch (e) {
        errorDetail = `HTTP error! status: ${response.status} ${response.statusText}`
        errorData = { status: response.status, statusText: response.statusText, parseError: String(e) }
      }

      // Handle common HTTP status codes with user-friendly messages
      if (response.status === 401) {
        errorDetail = 'Unauthorized. Please log in to access this resource.'
        // Redirect to login on 401 (after refresh attempt failed)
        if (typeof window !== 'undefined') {
          const { pathname, href } = window.location
          const isAuthRoute = pathname.startsWith('/auth')
          if (!isAuthRoute) {
            const redirect = encodeURIComponent(href)
            window.location.href = `/auth/login?redirect=${redirect}`
          }
        }
      } else if (response.status === 403) {
        // Redirect to login on 403 for /api/v1/me/ endpoints
        if (typeof window !== 'undefined') {
          const { pathname, href } = window.location
          const isAuthRoute = pathname.startsWith('/auth')
          if (!isAuthRoute) {
            const redirect = encodeURIComponent(href)
            window.location.href = `/auth/login?redirect=${redirect}`
          }
        }
        // Check if we have a token - if not, suggest login
        const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token')
        if (!hasToken) {
          errorDetail = 'Please log in to access your account information.'
        } else {
          errorDetail = 'Forbidden. You do not have permission to access this resource. Please check your login status.'
        }
      } else if (response.status === 404) {
        errorDetail = `Resource not found: ${endpoint}`
      } else if (response.status === 500) {
        errorDetail = 'Server error. Please try again later.'
      } else if (!errorDetail || errorDetail === 'Request failed' || errorDetail.includes('HTTP error!')) {
        errorDetail = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
      }

      const error = new Error(errorDetail)
      ;(error as any).status = response.status
      ;(error as any).statusText = response.statusText
      ;(error as any).data = errorData
      ;(error as any).url = url

      const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token')

      console.error('API Request failed:', {
        url,
        method: options.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        error: errorDetail,
        errorData: errorData,
        hasToken: !!hasToken
      })
      throw error
    }

    // Handle empty responses (e.g., 204 No Content for DELETE requests)
    if (response.status === 204) {
      return undefined as T
    }

    // Check content length before parsing
    const contentLength = response.headers.get('content-length')
    if (contentLength === '0') {
      return undefined as T
    }

    // Get response text first
    const text = await response.text()

    // If response is empty, return undefined
    if (!text || text.trim() === '') {
      return undefined as T
    }

    // Try to parse JSON
    try {
      return JSON.parse(text)
    } catch (e) {
      // If JSON parsing fails, it might be a non-JSON response
      // For void return types, return undefined
      if (text.trim() === '') {
        return undefined as T
      }
      // For non-empty non-JSON responses, return the text as-is
      return text as T
    }
  }

  // User Information
  async getMe(): Promise<any> {
    return this.request<any>('/api/v1/me/')
  }

  async updateMe(data: Partial<any>): Promise<any> {
    // Check if data contains File object (for avatar upload)
    const maybeAvatar: any = (data as any).avatar
    const hasFile = maybeAvatar instanceof File

    if (hasFile) {
      // Use FormData for file upload
      const formData = new FormData()
      Object.keys(data).forEach(key => {
        const value: any = (data as any)[key]
        if (key === 'avatar' && value instanceof File) {
          formData.append('avatar', value)
        } else if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, String(data[key]))
        }
      })

      return this.request<any>('/api/v1/me/', {
        method: 'PATCH',
        body: formData
        // Don't set Content-Type header, browser will set it with boundary for FormData
      })
    } else {
      // Use JSON for regular updates
      return this.request<any>('/api/v1/me/', {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
    }
  }

  async updateMeFull(data: any): Promise<any> {
    return this.request<any>('/api/v1/me/', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Addresses
  async getAddresses(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/v1/me/addresses/')
  }

  async getAddress(id: number): Promise<any> {
    return this.request<any>(`/api/v1/me/addresses/${id}/`)
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
    return this.request<any>('/api/v1/me/addresses/', {
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
    return this.request<any>(`/api/v1/me/addresses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deleteAddress(id: number): Promise<void> {
    return this.request<void>(`/api/v1/me/addresses/${id}/`, {
      method: 'DELETE'
    })
  }

  async getDefaultAddress(): Promise<any> {
    return this.request<any>('/api/v1/me/addresses/default/')
  }

  // Orders
  async getOrders(params?: { status?: string; page?: number; page_size?: number }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page != null) queryParams.append('page', String(params.page))
    if (params?.page_size != null) queryParams.append('page_size', String(params.page_size))

    const query = queryParams.toString()
    return this.request<ApiResponse<any>>(`/api/v1/me/orders/${query ? `?${query}` : ''}`)
  }

  async getOrder(id: number): Promise<any> {
    return this.request<any>(`/api/v1/me/orders/${id}/`)
  }

  async cancelOrder(
    id: number,
    data: {
      reason?: string
    }
  ): Promise<any> {
    return this.request<any>(`/api/v1/me/orders/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Settings
  async getSettings(): Promise<any> {
    return this.request<any>('/api/v1/me/settings/')
  }

  async updateSettings(data: Partial<any>): Promise<any> {
    return this.request<any>('/api/v1/me/settings/', {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async updateSettingsFull(data: any): Promise<any> {
    return this.request<any>('/api/v1/me/settings/', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Password
  async changePassword(data: { old_password: string; new_password: string; confirm_password: string }): Promise<any> {
    return this.request<any>('/api/v1/me/change-password/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async resetPassword(data: { email: string }): Promise<any> {
    return this.request<any>('/api/v1/me/reset-password/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Payment Methods
  async getPaymentMethods(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/api/v1/me/payment-methods/')
  }

  async getPaymentMethod(id: number): Promise<any> {
    return this.request<any>(`/api/v1/me/payment-methods/${id}/`)
  }

  async createPaymentMethod(data: {
    gateway: number // PaymentGateway ID
    method_type?: string // 'card', 'bank', 'wallet'
    cardholder_name?: string
    card_brand?: string // 'visa', 'mastercard', 'amex', etc.
    card_last4?: string // Last 4 digits only
    card_exp_month?: number
    card_exp_year?: number
    display_info?: string
    billing_address_id?: number
    is_default?: boolean
  }): Promise<any> {
    return this.request<any>('/api/v1/me/payment-methods/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updatePaymentMethod(
    id: number,
    data: Partial<{
      cardholder_name: string
      card_exp_month: number
      card_exp_year: number
      billing_address_id: number
      is_default: boolean
    }>
  ): Promise<any> {
    return this.request<any>(`/api/v1/me/payment-methods/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async deletePaymentMethod(id: number): Promise<void> {
    return this.request<void>(`/api/v1/me/payment-methods/${id}/`, {
      method: 'DELETE'
    })
  }

  // Payment History
  async getPayments(params?: { order_id?: number; status?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.order_id) queryParams.append('order_id', String(params.order_id))
    if (params?.status) queryParams.append('status', params.status)

    const query = queryParams.toString()
    return this.request<ApiResponse<any>>(`/api/v1/me/payments/${query ? `?${query}` : ''}`)
  }

  async getPayment(id: number): Promise<any> {
    return this.request<any>(`/api/v1/me/payments/${id}/`)
  }

  async sendPaymentReceipt(id: number): Promise<any> {
    return this.request<any>(`/api/v1/me/payments/${id}/send/`, {
      method: 'POST'
    })
  }

  // Invoices
  async getInvoices(params?: { order_id?: number }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.order_id) queryParams.append('order_id', String(params.order_id))

    const query = queryParams.toString()
    return this.request<ApiResponse<any>>(`/api/v1/me/invoices/${query ? `?${query}` : ''}`)
  }

  async getInvoice(id: number): Promise<any> {
    return this.request<any>(`/api/v1/me/invoices/${id}/`)
  }

  async downloadInvoice(id: number, retryOn401: boolean = true): Promise<Blob> {
    const endpoint = `/api/v1/me/invoices/${id}/download/`
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {}

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    // Handle 401 Unauthorized or 403 Forbidden - try to refresh token and retry
    // Both can indicate an expired token
    if ((response.status === 401 || response.status === 403) && retryOn401) {
      const newToken = await refreshTokenIfNeeded()
      if (newToken) {
        // Retry the request with new token
        return this.downloadInvoice(id, false) // Don't retry again if it fails
      }
      // If refresh failed, fall through to error handling
    }

    if (!response.ok) {
      let errorDetail = 'Failed to download invoice'
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      try {
        if (isJson) {
          const errorData = await response.json()
          errorDetail = errorData.detail || errorData.message || errorDetail
        } else {
          const text = await response.text()
          if (text) {
            errorDetail = text
          }
        }
      } catch (e) {
        errorDetail = `HTTP error! status: ${response.status} ${response.statusText}`
      }

      const error = new Error(errorDetail)
      ;(error as any).status = response.status
      throw error
    }

    return response.blob()
  }

  async sendInvoice(id: number): Promise<any> {
    return this.request<any>(`/api/v1/me/invoices/${id}/send/`, {
      method: 'POST'
    })
  }

  // Payment Gateways (use storefront API)
  async getPaymentGateways(): Promise<any[]> {
    return this.request<any[]>('/api/store/payments/gateways/')
  }

  // Create payment method with Stripe integration
  async createPaymentMethodWithStripe(data: {
    gateway: number // PaymentGateway ID
    gateway_payment_method_data: {
      payment_method_id: string // Stripe PaymentMethod ID (pm_...)
    }
    is_default?: boolean
    billing_address_id?: number
  }): Promise<any> {
    return this.request<any>('/api/v1/me/payment-methods/', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export const meApi = new MeApiClient()
