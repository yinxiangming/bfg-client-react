// Options API service for dynamic select fields

import { apiFetch, buildApiUrl, API_VERSIONS, getApiBaseUrl } from '@/utils/api'

export interface OptionItem {
  value: string | number
  label: string
  code?: string
  [key: string]: any
}

// Cache for options data
let optionsCache: Record<string, OptionItem[]> = {}

/**
 * Fetch options from API endpoint
 * Supports both full URLs and relative paths (will be converted to full URLs)
 */
export async function fetchOptionsFromApi(endpoint: string): Promise<OptionItem[]> {
  try {
    // Validate endpoint - ensure it's a list endpoint, not a detail endpoint
    // If endpoint ends with a number followed by /, it's likely a detail endpoint
    const detailEndpointPattern = /\/(\d+)\/?$/
    if (detailEndpointPattern.test(endpoint)) {
      console.warn(`fetchOptionsFromApi: Endpoint appears to be a detail endpoint, not a list: ${endpoint}`)
      // Try to convert to list endpoint by removing the ID part
      const listEndpoint = endpoint.replace(detailEndpointPattern, '/')
      console.warn(`fetchOptionsFromApi: Attempting to use list endpoint instead: ${listEndpoint}`)
      endpoint = listEndpoint
    }

    // If endpoint is a relative path, convert it to full URL
    let fullUrl = endpoint
    if (endpoint.startsWith('/api/')) {
      // Already a full path, use as is
      fullUrl = `${getApiBaseUrl()}${endpoint}`
    } else if (endpoint.startsWith('/')) {
      // Relative path, build full URL with BFG2 API version
      fullUrl = buildApiUrl(endpoint, API_VERSIONS.BFG2)
    }
    // If it's already a full URL (starts with http), use as is

    const response = await apiFetch<OptionItem[] | { results?: OptionItem[]; data?: OptionItem[] }>(fullUrl)
    if (Array.isArray(response)) {
      return response
    }
    return response.results || response.data || []
  } catch (error: any) {
    // Don't log 404 errors as errors - they might be expected for optional fields
    if (error?.status === 404) {
      console.warn(`Options endpoint not found (404): ${endpoint}. Returning empty options.`)
    } else {
      console.error(`Failed to fetch options from ${endpoint}:`, error)
    }
    return []
  }
}

/**
 * Fetch all options from cache endpoint and store in cache
 * Returns empty cache if endpoint doesn't exist or returns non-JSON response
 */
export async function fetchAllOptionsFromCache(cacheEndpoint: string = '/api/v1/options/'): Promise<Record<string, OptionItem[]>> {
  try {
    // Build full URL if relative path
    let fullUrl = cacheEndpoint
    if (cacheEndpoint.startsWith('/api/')) {
      fullUrl = `${getApiBaseUrl()}${cacheEndpoint}`
    } else if (cacheEndpoint.startsWith('/')) {
      fullUrl = buildApiUrl(cacheEndpoint, API_VERSIONS.BFG2)
    }

    // Try to fetch, but handle gracefully if endpoint doesn't exist
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(typeof window !== 'undefined' && localStorage.getItem('auth_token') 
          ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          : {})
      }
    })

    // If endpoint doesn't exist (404) or returns HTML, return empty cache
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      console.warn(`Options cache endpoint not available: ${fullUrl} (status: ${response.status})`)
      return optionsCache
    }

    const data = await response.json()
    optionsCache = data || {}
    return optionsCache
  } catch (error: any) {
    // Silently fail if endpoint doesn't exist - this is expected in some setups
    if (error.message?.includes('Expected JSON') || error.message?.includes('404')) {
      console.warn(`Options cache endpoint not available: ${cacheEndpoint}. Using empty cache.`)
    } else {
      console.error(`Failed to fetch options cache from ${cacheEndpoint}:`, error)
    }
    return optionsCache
  }
}

/**
 * Get options from cache by code
 */
export function getOptionsFromCache(code: string): OptionItem[] {
  return optionsCache[code] || []
}

/**
 * Filter options from cache by code and additional filter
 */
export function filterOptionsFromCache(code: string, filter?: (item: OptionItem) => boolean): OptionItem[] {
  const options = getOptionsFromCache(code)
  if (!filter) return options
  return options.filter(filter)
}

