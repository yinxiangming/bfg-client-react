/**
 * Authentication API Client
 *
 * Client for authentication endpoints
 */

import { getApiBaseUrl } from './api'
import { getApiLanguageHeaders } from '@/i18n/http'

interface LoginRequest {
  username?: string
  email?: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  password_confirm: string
  first_name?: string
  last_name?: string
}

interface TokenResponse {
  access?: string
  refresh?: string
  token?: string // Fallback for non-JWT endpoints
  user_id?: number
  username?: string
}

interface RegisterResponse {
  user: {
    id: number
    username: string
    email: string
    first_name?: string
    last_name?: string
  }
  access: string
  refresh: string
}

class AuthApiClient {
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

  private getJsonHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...getApiLanguageHeaders()
    }
  }

  /**
   * Login with username/email and password
   * Stores token in localStorage on success
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const url = `${this.baseUrl}/api/v1/auth/token/`

    // Determine if the input is an email or username
    const usernameOrEmail = credentials.username || credentials.email || ''
    const isEmail = usernameOrEmail.includes('@')

    // Prepare request body - backend accepts both username and email fields
    const requestBody: any = {
      password: credentials.password
    }

    if (isEmail) {
      // If it's an email, send it in the email field only (don't send username)
      requestBody.email = usernameOrEmail
    } else {
      // If it's a username, send it in the username field only (don't send email)
      requestBody.username = usernameOrEmail
    }

    console.log('Login request body:', requestBody)
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getJsonHeaders(),
      body: JSON.stringify(requestBody)
    })

    console.log('Login response status:', response.status, response.statusText)

    if (!response.ok) {
      let errorDetail = 'Login failed'
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      try {
        if (isJson) {
          const errorData = await response.json()
          console.error('Login API error response:', errorData)

          // Check if errorData is empty object
          const errorKeys = Object.keys(errorData || {})
          if (errorKeys.length === 0) {
            errorDetail = `Invalid request format. Please check your credentials and try again.`
          } else {
            // Check for field-specific errors (DRF format)
            if (errorData.username) {
              errorDetail = Array.isArray(errorData.username) ? errorData.username[0] : errorData.username
            } else if (errorData.email) {
              errorDetail = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
            } else if (errorData.password) {
              errorDetail = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password
            } else if (errorData.detail) {
              errorDetail = errorData.detail
            } else if (errorData.message) {
              errorDetail = errorData.message
            } else if (errorData.error) {
              errorDetail = errorData.error
            } else {
              // Try to get first error message from any field
              const firstError = Object.values(errorData)[0]
              errorDetail = Array.isArray(firstError)
                ? firstError[0]
                : String(firstError) || `HTTP error! status: ${response.status}`
            }
          }
        } else {
          const text = await response.text()
          errorDetail = text || `HTTP error! status: ${response.status} ${response.statusText}`
        }
      } catch (e) {
        errorDetail = `HTTP error! status: ${response.status} ${response.statusText}`
      }

      const error = new Error(errorDetail)
      ;(error as any).status = response.status
      throw error
    }

    const data: TokenResponse = await response.json()

    // Store tokens in localStorage
    // JWT returns 'access' and 'refresh' tokens
    const token = data.access || data.token
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      console.log('Login successful: Access token stored in localStorage')
    } else {
      console.warn('Login response did not contain a token:', data)
    }

    // Store refresh token if available
    if (data.refresh && typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', data.refresh)
      console.log('Login successful: Refresh token stored in localStorage')
    }

    return data
  }

  /**
   * Register a new user account
   * Stores token in localStorage on success
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const url = `${this.baseUrl}/api/v1/auth/register/`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getJsonHeaders(),
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      let errorDetail = 'Registration failed'
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      try {
        if (isJson) {
          const errorData = await response.json()
          console.error('Register API error response:', errorData)

          // Check for field-specific errors (DRF format)
          if (errorData.email) {
            errorDetail = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
          } else if (errorData.password) {
            errorDetail = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password
          } else if (errorData.password_confirm) {
            errorDetail = Array.isArray(errorData.password_confirm)
              ? errorData.password_confirm[0]
              : errorData.password_confirm
          } else if (errorData.detail) {
            errorDetail = errorData.detail
          } else if (errorData.message) {
            errorDetail = errorData.message
          } else {
            // Try to get first error message from any field
            const firstError = Object.values(errorData)[0]
            errorDetail = Array.isArray(firstError)
              ? firstError[0]
              : String(firstError) || `HTTP error! status: ${response.status}`
          }
        } else {
          const text = await response.text()
          errorDetail = text || `HTTP error! status: ${response.status} ${response.statusText}`
        }
      } catch (e) {
        errorDetail = `HTTP error! status: ${response.status} ${response.statusText}`
      }

      const error = new Error(errorDetail)
      ;(error as any).status = response.status
      throw error
    }

    const result: RegisterResponse = await response.json()

    // Store tokens in localStorage
    if (result.access && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', result.access)
      console.log('Registration successful: Access token stored in localStorage')
    }

    if (result.refresh && typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', result.refresh)
      console.log('Registration successful: Refresh token stored in localStorage')
    }

    return result
  }

  /**
   * Logout - removes tokens from localStorage
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      console.log('Logged out: Tokens removed from localStorage')
    }
  }

  /**
   * Check if user is logged in (has token in localStorage)
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('auth_token')
  }

  /**
   * Get current access token from localStorage
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refresh_token')
  }

  /**
   * Refresh access token using refresh token
   * Returns new access and refresh tokens
   */
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const url = `${this.baseUrl}/api/v1/auth/token/refresh/`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getJsonHeaders(),
      body: JSON.stringify({ refresh: refreshToken })
    })

    if (!response.ok) {
      // If refresh fails, clear tokens and throw error
      this.logout()
      let errorDetail = 'Token refresh failed'
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      try {
        if (isJson) {
          const errorData = await response.json()
          errorDetail = errorData.detail || errorData.message || errorDetail
        }
      } catch (e) {
        errorDetail = `HTTP error! status: ${response.status} ${response.statusText}`
      }

      const error = new Error(errorDetail)
      ;(error as any).status = response.status
      throw error
    }

    const data: TokenResponse = await response.json()

    // Store new tokens
    if (data.access && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.access)
      console.log('Token refreshed: New access token stored')
    }

    // Store new refresh token if provided (token rotation)
    if (data.refresh && typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', data.refresh)
      console.log('Token refreshed: New refresh token stored')
    }

    return data
  }

  /**
   * Request password reset (forgot password)
   */
  async forgotPassword(email: string): Promise<{ detail: string }> {
    const url = `${this.baseUrl}/api/v1/auth/forgot-password/`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getJsonHeaders(),
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      let errorDetail = 'Failed to send password reset email'
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      try {
        if (isJson) {
          const errorData = await response.json()
          if (errorData.email) {
            errorDetail = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email
          } else if (errorData.detail) {
            errorDetail = errorData.detail
          }
        }
      } catch (e) {
        errorDetail = `HTTP error! status: ${response.status} ${response.statusText}`
      }

      const error = new Error(errorDetail)
      ;(error as any).status = response.status
      throw error
    }

    return await response.json()
  }

  /**
   * Reset password with token
   */
  async resetPasswordConfirm(
    uid: string,
    token: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Promise<{ detail: string }> {
    const url = `${this.baseUrl}/api/v1/auth/reset-password-confirm/`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getJsonHeaders(),
      body: JSON.stringify({
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm
      })
    })

    if (!response.ok) {
      let errorDetail = 'Failed to reset password'
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      try {
        if (isJson) {
          const errorData = await response.json()
          if (errorData.detail) {
            errorDetail = errorData.detail
          } else if (errorData.new_password) {
            errorDetail = Array.isArray(errorData.new_password) ? errorData.new_password[0] : errorData.new_password
          } else if (errorData.new_password_confirm) {
            errorDetail = Array.isArray(errorData.new_password_confirm)
              ? errorData.new_password_confirm[0]
              : errorData.new_password_confirm
          }
        }
      } catch (e) {
        errorDetail = `HTTP error! status: ${response.status} ${response.statusText}`
      }

      const error = new Error(errorDetail)
      ;(error as any).status = response.status
      throw error
    }

    return await response.json()
  }

  /**
   * Verify email
   */
  async verifyEmail(key: string): Promise<{ detail: string }> {
    const url = `${this.baseUrl}/api/v1/auth/verify-email/`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getJsonHeaders(),
      body: JSON.stringify({ key })
    })

    if (!response.ok) {
      let errorDetail = 'Failed to verify email'
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      try {
        if (isJson) {
          const errorData = await response.json()
          errorDetail = errorData.detail || errorData.key || 'Invalid verification key'
        }
      } catch (e) {
        errorDetail = `HTTP error! status: ${response.status} ${response.statusText}`
      }

      const error = new Error(errorDetail)
      ;(error as any).status = response.status
      throw error
    }

    return await response.json()
  }
}

export const authApi = new AuthApiClient()
