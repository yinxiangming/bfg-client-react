/**
 * JWT storage: platform vs workspace realms.
 *
 * When both APIs share the same base URL (embedded mode), realm prefixes
 * still keep two tokens without overwriting each other.
 *
 * Includes legacy migration from `auth_token` / `refresh_token` keys
 * for users upgrading from workspace-only setups.
 */

import {
  getPlatformApiBaseUrl,
  getWorkspaceApiBaseUrlForStorage,
  normalizeApiBaseUrl,
} from './apiUrls'

const JWT_PLATFORM = 'bfg_jwt:platform:'
const JWT_WORKSPACE = 'bfg_jwt:workspace:'
const REFRESH_WORKSPACE = 'bfg_refresh:workspace:'
const LEGACY_AUTH = 'auth_token'
const LEGACY_REFRESH = 'refresh_token'

function platformAccessKey(): string {
  return JWT_PLATFORM + normalizeApiBaseUrl(getPlatformApiBaseUrl())
}

function workspaceAccessKey(): string {
  return JWT_WORKSPACE + normalizeApiBaseUrl(getWorkspaceApiBaseUrlForStorage())
}

function workspaceRefreshKey(): string {
  return REFRESH_WORKSPACE + normalizeApiBaseUrl(getWorkspaceApiBaseUrlForStorage())
}

// ── Platform Token ──────────────────────────────────────────────────────────

export function getPlatformToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(platformAccessKey())
}

export function setPlatformToken(token: string | null): void {
  if (typeof window === 'undefined') return
  const key = platformAccessKey()
  if (token) localStorage.setItem(key, token)
  else localStorage.removeItem(key)
}

// ── Workspace Token (with legacy migration) ─────────────────────────────────

export function getWorkspaceToken(): string | null {
  if (typeof window === 'undefined') return null
  const key = workspaceAccessKey()
  let v = localStorage.getItem(key)
  if (v) return v
  // Legacy migration
  const legacy = localStorage.getItem(LEGACY_AUTH)
  if (legacy) {
    localStorage.setItem(key, legacy)
    localStorage.removeItem(LEGACY_AUTH)
    return legacy
  }
  return null
}

export function setWorkspaceToken(token: string | null): void {
  if (typeof window === 'undefined') return
  const key = workspaceAccessKey()
  if (token) {
    localStorage.setItem(key, token)
    localStorage.removeItem(LEGACY_AUTH)
  } else {
    localStorage.removeItem(key)
    localStorage.removeItem(LEGACY_AUTH)
  }
}

export function getWorkspaceRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  const key = workspaceRefreshKey()
  let v = localStorage.getItem(key)
  if (v) return v
  // Legacy migration
  const legacy = localStorage.getItem(LEGACY_REFRESH)
  if (legacy) {
    localStorage.setItem(key, legacy)
    localStorage.removeItem(LEGACY_REFRESH)
    return legacy
  }
  return null
}

export function setWorkspaceRefreshToken(token: string | null): void {
  if (typeof window === 'undefined') return
  const key = workspaceRefreshKey()
  if (token) {
    localStorage.setItem(key, token)
    localStorage.removeItem(LEGACY_REFRESH)
  } else {
    localStorage.removeItem(key)
    localStorage.removeItem(LEGACY_REFRESH)
  }
}

// ── Cookie (for SSR / middleware) ────────────────────────────────────────────

/** Mirror active workspace session for SSR/middleware (last token written by callers). */
export function setAccessTokenCookie(token: string): void {
  if (typeof window === 'undefined') return
  document.cookie = `access_token=${token}; path=/;`
}

// ── Clear all ───────────────────────────────────────────────────────────────

/** Clear workspace access + refresh for current storage base and legacy keys. */
export function clearWorkspaceAuthTokens(): void {
  if (typeof window === 'undefined') return
  setWorkspaceToken(null)
  setWorkspaceRefreshToken(null)
}

/**
 * Clear JWT + refresh for both platform and workspace bases (logout everywhere).
 */
export function clearAllPartitionedAuthTokens(): void {
  if (typeof window === 'undefined') return
  try {
    setPlatformToken(null)
  } catch {
    /* NEXT_PUBLIC_API_URL may be unset in tests */
  }
  try {
    setWorkspaceToken(null)
    setWorkspaceRefreshToken(null)
  } catch {
    /* env */
  }
}
