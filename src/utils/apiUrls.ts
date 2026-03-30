/**
 * Workspace BFG API base URL resolution. Single place for env reads; no hardcoded localhost fallbacks.
 */

export function normalizeApiBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

/**
 * Default workspace BFG base from env (SSR and browser).
 * Mirrors getApiBaseUrl() semantics: API_URL on server when set, else NEXT_PUBLIC_API_URL.
 */
export function getWorkspaceApiBaseUrlFromEnv(): string {
  const serverUrl = typeof window === 'undefined' ? process.env.API_URL : undefined
  const apiBaseUrl = serverUrl || process.env.NEXT_PUBLIC_API_URL
  if (!apiBaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and set NEXT_PUBLIC_API_URL (e.g. your API base URL).'
    )
  }
  return normalizeApiBaseUrl(apiBaseUrl)
}

const WORKSPACE_URL_KEY = 'workspace_api_url'

/**
 * Workspace BFG base for storage keys and requests: optional per-tenant override after token exchange, then env.
 */
export function getWorkspaceApiBaseUrlForStorage(): string {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem(WORKSPACE_URL_KEY)?.trim()
    if (override) return normalizeApiBaseUrl(override)
  }
  return getWorkspaceApiBaseUrlFromEnv()
}

export function setWorkspaceApiUrlOverride(url: string | null): void {
  if (typeof window === 'undefined') return
  if (url) {
    localStorage.setItem(WORKSPACE_URL_KEY, normalizeApiBaseUrl(url))
  } else {
    localStorage.removeItem(WORKSPACE_URL_KEY)
  }
}
