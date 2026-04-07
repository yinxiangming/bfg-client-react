/**
 * Platform API service
 *
 * Handles workspace listing, Token Exchange, and post-login routing
 * for Platform instances (BFG_INSTANCE_TYPE=platform).
 */

import { apiFetch, buildApiUrl } from '@/utils/api'

// Types

export interface WorkspacePlatformProfile {
  id: number
  workspace_id: number
  workspace_name: string
  workspace_slug: string
  workspace_uuid: string
  remote_workspace_uuid: string | null
  cluster_id: string | null
  cluster_region: string | null
  region: string
  custom_domain: string
  ssl_status: string
  suspended_at: string | null
  created_at: string
}

export interface WorkspaceMembership {
  id: number
  workspace_id: number
  workspace_name: string
  workspace_slug: string
  workspace_uuid: string
  role_name: string
  role_code: string
  platform_profile: WorkspacePlatformProfile | null
  is_active: boolean
  created_at: string
}

export interface TokenExchangeResponse {
  workspace_token: string
  workspace_refresh: string
  workspace_url: string
  workspace: {
    id: number
    name: string
    slug: string
  }
}

export interface SSOStartResponse {
  redirect_url: string
}

export interface SSOExchangeResponse {
  access: string
  refresh: string
  workspace_url?: string
  workspace_frontend_url?: string
  workspace: {
    id: number
    uuid: string | null
    name: string
    slug: string
  }
  next: string
  embedded: boolean
}

// API functions

/** Maps GET /platform/workspaces/me/ payload to WorkspaceMembership (embedded uses `id`/`slug`; standalone may use workspace_* fields). */
function mapMeWorkspacesPayload(data: {
  workspaces?: Array<Record<string, unknown> & { id: number }>
}): WorkspaceMembership[] {
  const list = data.workspaces ?? []
  return list.map((w) => ({
    id: w.id,
    workspace_id: (w.workspace_id as number | undefined) ?? w.id,
    workspace_name: (w.workspace_name as string) ?? (w.name as string) ?? '',
    workspace_slug: (w.workspace_slug as string) ?? (w.slug as string) ?? '',
    workspace_uuid: (w.workspace_uuid as string) ?? (w.uuid as string) ?? '',
    role_name: (w.role_name as string) ?? String(w.role ?? ''),
    role_code: (w.role_code as string) ?? String(w.role ?? ''),
    platform_profile: (w.platform_profile as WorkspacePlatformProfile | null) ?? null,
    is_active: (w.is_active as boolean) ?? true,
    created_at: (w.created_at as string) ?? '',
  }))
}

export async function getMyWorkspaces(): Promise<WorkspaceMembership[]> {
  const url = buildApiUrl('/platform/workspaces/me/')
  const data = await apiFetch<{ workspaces?: Array<Record<string, unknown> & { id: number }> }>(url)
  return mapMeWorkspacesPayload(data)
}

export async function tokenExchange(workspaceId: number): Promise<TokenExchangeResponse> {
  const url = buildApiUrl('/platform/auth/token-exchange/')
  return apiFetch<TokenExchangeResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ workspace_id: workspaceId }),
  })
}

/**
 * Exchange a one-time SSO code for workspace JWT tokens.
 * Called by /admin/sso page after redirect from platform.
 */
export async function ssoExchange(code: string): Promise<SSOExchangeResponse> {
  const url = buildApiUrl('/platform/auth/sso/exchange/')
  return apiFetch<SSOExchangeResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

/**
 * Initiate SSO login: generates a one-time code and returns a redirect URL
 * to the target workspace domain.
 */
export async function ssoStart(
  workspaceId: number | string,
  next: string = '/admin',
): Promise<SSOStartResponse> {
  const url = buildApiUrl('/platform/auth/sso/start/')
  return apiFetch<SSOStartResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ workspace_id: workspaceId, next }),
  })
}

/**
 * Post-login routing for Platform instances.
 * Checks user's workspaces and initiates SSO redirect to the target workspace.
 *
 * Flow:
 *   1. Fetch user's workspaces
 *   2. If single workspace → call sso/start → browser redirect to workspace domain
 *   3. Workspace frontend /admin/sso exchanges code for JWT
 *
 * @param routerPush - router.push function (used for fallback only)
 * @param fallbackRedirect - where to go if no workspace or on error (default: '/account')
 * @returns true if routing was handled, false if caller should use default redirect
 */
export async function handlePlatformPostLogin(
  routerPush: (url: string) => void,
  fallbackRedirect: string = '/account',
): Promise<boolean> {
  try {
    const workspaces = await getMyWorkspaces()

    if (workspaces.length === 0) {
      routerPush(fallbackRedirect)
      return true
    }

    if (workspaces.length === 1) {
      const ws = workspaces[0]
      const result = await ssoStart(ws.workspace_id)

      // Cross-domain redirect: browser navigates to workspace domain with SSO code
      window.location.href = result.redirect_url
      return true
    }

    // Multiple workspaces — go to selection (MVP: fall back to account)
    routerPush(fallbackRedirect)
    return true
  } catch (err) {
    console.error('Platform post-login routing failed:', err)
    routerPush(fallbackRedirect)
    return true
  }
}

/**
 * Check if the current instance is a Platform instance.
 */
export function isPlatformInstance(): boolean {
  return process.env.NEXT_PUBLIC_BFG_INSTANCE_TYPE === 'platform'
}
