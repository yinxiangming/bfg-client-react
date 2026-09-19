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

/**
 * Workspace id a sign-in flow pinned for `getWorkspaceId()` (utils/api.ts), which sends
 * it as `X-Workspace-ID`. `setWorkspaceToken` keeps an existing pin on the access token's
 * `workspace_id` claim.
 */
export const WORKSPACE_ID_KEY = 'workspace_id'

function platformAccessKey(): string {
  return JWT_PLATFORM + normalizeApiBaseUrl(getPlatformApiBaseUrl())
}

function workspaceAccessKey(): string {
  return JWT_WORKSPACE + normalizeApiBaseUrl(getWorkspaceApiBaseUrlForStorage())
}

/** Whether a localStorage key holds a workspace access token, whichever API base it is for. */
export function isWorkspaceAccessKey(key: string | null): boolean {
  return key?.startsWith(JWT_WORKSPACE) ?? false
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

/**
 * The `workspace_id` claim of an access token, or null when the token has none or is not
 * a decodable JWT. Reads the payload without verifying it; the API checks the signature.
 */
export function readWorkspaceIdClaim(token: string | null | undefined): number | null {
  const payload = token?.split('.')[1]
  if (!payload) return null
  try {
    // JWT segments are base64url; atob only accepts the standard alphabet.
    const claim = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))?.workspace_id
    return typeof claim === 'number' ? claim : null
  } catch {
    return null
  }
}

/**
 * Keep a pinned `WORKSPACE_ID_KEY` on the workspace an access token was minted for.
 *
 * The API lets a superuser's `X-Workspace-ID` override the token's claim, so a pin left
 * over from an earlier sign-in or switch would send their requests to that workspace
 * instead. Only an existing pin is updated: the pin also goes out on anonymous storefront
 * requests, where the API prefers it to the domain, so creating one would move this
 * browser's storefront to whichever workspace the admin last opened. A token without the
 * claim leaves the pin alone.
 */
function syncWorkspaceIdPin(token: string): void {
  if (!localStorage.getItem(WORKSPACE_ID_KEY)) return
  const workspaceId = readWorkspaceIdClaim(token)
  if (workspaceId !== null) localStorage.setItem(WORKSPACE_ID_KEY, String(workspaceId))
}

export function setWorkspaceToken(token: string | null): void {
  if (typeof window === 'undefined') return
  const key = workspaceAccessKey()
  if (token) {
    localStorage.setItem(key, token)
    localStorage.removeItem(LEGACY_AUTH)
    syncWorkspaceIdPin(token)
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
