/**
 * API base URL resolution for Platform vs Workspace (BFG) servers.
 * Single place for env reads; no hardcoded localhost fallbacks.
 *
 * Embedded mode:  getPlatformApiBaseUrl() === getWorkspaceApiBaseUrlFromEnv()
 * Standalone mode: they may differ (Platform :8011, Workspace :8000)
 */

export function normalizeApiBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

/** Platform admin API base (NEXT_PUBLIC_API_URL). */
export function getPlatformApiBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_API_URL
  if (!u) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and set it to your API base URL.'
    )
  }
  return normalizeApiBaseUrl(u)
}

/**
 * Default workspace BFG base from env (SSR and browser).
 * Standalone: NEXT_PUBLIC_WORKSPACE_API_URL (separate workspace server)
 * Embedded:   falls back to NEXT_PUBLIC_API_URL (same server)
 */
export function getWorkspaceApiBaseUrlFromEnv(): string {
  const serverUrl = typeof window === 'undefined' ? process.env.API_URL : undefined
  const u = serverUrl
    || process.env.NEXT_PUBLIC_WORKSPACE_API_URL
    || process.env.NEXT_PUBLIC_API_URL
  if (!u) {
    throw new Error(
      'Set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_WORKSPACE_API_URL for the workspace BFG API base URL.'
    )
  }
  return normalizeApiBaseUrl(u)
}

const WORKSPACE_URL_KEY = 'workspace_api_url'

/**
 * Workspace BFG base for client storage and requests:
 * optional per-tenant override (after token exchange in standalone mode) → env.
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
