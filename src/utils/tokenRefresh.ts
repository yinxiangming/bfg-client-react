/**
 * Token Refresh Utility
 *
 * Handles automatic token refresh with concurrency control
 * to prevent multiple simultaneous refresh requests
 */

import { authApi } from './authApi'

let refreshPromise: Promise<string | null> | null = null

/**
 * Refresh access token if needed
 * Returns the current or new access token
 * Prevents concurrent refresh requests
 */
export async function refreshTokenIfNeeded(): Promise<string | null> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    try {
      return await refreshPromise
    } catch (error) {
      // If refresh failed, clear the promise and return null
      refreshPromise = null
      return null
    }
  }

  // Check if we have a refresh token
  const refreshToken = authApi.getRefreshToken()
  if (!refreshToken) {
    return null
  }

  // Start refresh process
  refreshPromise = (async () => {
    try {
      const result = await authApi.refreshToken()
      return result.access || null
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Clear tokens on refresh failure
      authApi.logout()
      throw error
    } finally {
      // Clear the promise after refresh completes
      refreshPromise = null
    }
  })()

  try {
    return await refreshPromise
  } catch (error) {
    return null
  }
}

/**
 * Clear any pending refresh promise
 * Useful for logout or error recovery
 */
export function clearRefreshPromise(): void {
  refreshPromise = null
}
