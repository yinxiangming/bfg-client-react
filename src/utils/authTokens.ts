/**
 * Workspace JWT storage keyed by API base URL (supports token exchange changing workspace origin).
 * Migrates legacy `auth_token` / `refresh_token` keys on first read.
 */

import { normalizeApiBaseUrl, getWorkspaceApiBaseUrlForStorage } from './apiUrls'

const JWT_WORKSPACE = 'bfg_jwt:workspace:'
const REFRESH_WORKSPACE = 'bfg_refresh:workspace:'
const LEGACY_AUTH = 'auth_token'
const LEGACY_REFRESH = 'refresh_token'

function workspaceAccessKey(): string {
  return JWT_WORKSPACE + normalizeApiBaseUrl(getWorkspaceApiBaseUrlForStorage())
}

function workspaceRefreshKey(): string {
  return REFRESH_WORKSPACE + normalizeApiBaseUrl(getWorkspaceApiBaseUrlForStorage())
}

export function getWorkspaceToken(): string | null {
  if (typeof window === 'undefined') return null
  const key = workspaceAccessKey()
  let v = localStorage.getItem(key)
  if (v) return v
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

/** Clear workspace access + refresh for current storage base and legacy keys. */
export function clearWorkspaceAuthTokens(): void {
  if (typeof window === 'undefined') return
  setWorkspaceToken(null)
  setWorkspaceRefreshToken(null)
}
