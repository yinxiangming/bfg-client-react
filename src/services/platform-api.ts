/**
 * Platform API Client
 *
 * 后端路由通过 DefaultRouter 自动生成，挂载于 /api/v1/platform/
 * 自动装载机制见 resale-website/server/config/urls.py → get_local_apps()
 *
 * 路由映射（Router 标准）:
 *   GET  /api/v1/platform/workspaces/              WorkspaceViewSet.list
 *   POST /api/v1/platform/workspaces/              WorkspaceViewSet.create
 *   GET  /api/v1/platform/workspaces/{id}/         WorkspaceViewSet.retrieve
 *   GET  /api/v1/platform/workspaces/me/           WorkspaceViewSet.me
 *   POST /api/v1/platform/workspaces/{id}/suspend/ WorkspaceViewSet.suspend
 *   POST /api/v1/platform/workspaces/{id}/resume/  WorkspaceViewSet.resume
 *   GET  /api/v1/platform/workspaces/{id}/subscription/ WorkspaceViewSet.subscription
 *   POST /api/v1/platform/workspaces/{id}/checkout/ WorkspaceViewSet.checkout
 *   GET  /api/v1/platform/plans/                   PlanViewSet.list
 *   GET  /api/v1/platform/sso/check/               SSOConfigViewSet.check
 *   POST /api/v1/platform/auth/token-exchange/     AuthViewSet.token_exchange
 *   GET  /api/v1/platform/auth/sso-check/          AuthViewSet.sso_check
 *   POST /api/v1/platform/webhooks/stripe/         WebhookViewSet.stripe
 */

import { getPlatformApiBaseUrl, getWorkspaceApiBaseUrlFromEnv } from '@/utils/apiUrls'
import { getPlatformToken } from '@/utils/authTokens'

/** Platform admin API base (NEXT_PUBLIC_API_URL). */
export const getBaseUrl = getPlatformApiBaseUrl

/** Default workspace BFG base from env (no localStorage override). */
export const getWorkspaceBaseUrl = getWorkspaceApiBaseUrlFromEnv

const getPlatformUrl = () => `${getPlatformApiBaseUrl()}/api/v1/platform`

async function platformFetch(path: string, options: RequestInit = {}) {
  const PLATFORM = getPlatformUrl()
  const incoming = (options.headers as Record<string, string>) || {}
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...incoming,
  }
  if (!headers.Authorization && !headers.authorization) {
    const t = getPlatformToken()
    if (t) headers.Authorization = `Bearer ${t}`
  }
  const res = await fetch(`${PLATFORM}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || `API error ${res.status}`)
  }
  return res.json()
}

// ── My Workspaces ─────────────────────────────────────────────
/** Uses partitioned platform JWT when `token` is omitted. */
export async function getMyWorkspaces(token?: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return platformFetch('/workspaces/me/', { headers })
}

// ── Workspace CRUD ────────────────────────────────────────────
export async function getWorkspaces(token?: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return platformFetch('/workspaces/', { headers })
}

export async function getWorkspace(id: number, token?: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return platformFetch(`/workspaces/${id}/`, { headers })
}

export async function createWorkspace(
  data: { name: string; slug: string; domain?: string; region?: string },
  token?: string | null,
) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return platformFetch('/workspaces/', {
    method: 'POST',
    body: JSON.stringify(data),
    headers,
  })
}

export async function suspendWorkspace(id: number, reason: string, token?: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return platformFetch(`/workspaces/${id}/suspend/`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    headers,
  })
}

export async function resumeWorkspace(id: number, token?: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return platformFetch(`/workspaces/${id}/resume/`, {
    method: 'POST',
    body: JSON.stringify({}),
    headers,
  })
}

// ── Subscription ──────────────────────────────────────────────
export async function getWorkspaceSubscription(id: number, token?: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return platformFetch(`/workspaces/${id}/subscription/`, { headers })
}

export async function createCheckout(
  workspaceId: number,
  planId: number,
  billingInterval: 'monthly' | 'annual',
  token?: string | null,
) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return platformFetch(`/workspaces/${workspaceId}/checkout/`, {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId, billing_interval: billingInterval }),
    headers,
  })
}

// ── Plans (public) ────────────────────────────────────────────
export async function getPlans() {
  return platformFetch('/plans/')
}

// ── Token Exchange ────────────────────────────────────────────
export async function tokenExchange(workspaceId: string | number, platformToken: string) {
  return platformFetch('/auth/token-exchange/', {
    method: 'POST',
    body: JSON.stringify({ workspace_id: String(workspaceId) }),
    headers: { Authorization: `Bearer ${platformToken}` },
  })
}

// ── SSO ───────────────────────────────────────────────────────
export async function checkSSO(domain: string) {
  // SSO check is public — do not send Authorization header.
  // Sending an expired token would cause a 401/403 from simplejwt.
  const res = await fetch(
    `${getPlatformUrl()}/auth/sso-check/?domain=${encodeURIComponent(domain)}`
  )
  if (!res.ok) return { sso_enabled: false }
  return res.json()
}
