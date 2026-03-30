/**
 * Platform API service
 *
 * Handles workspace listing, Token Exchange, and post-login routing
 * for Platform instances (BFG_INSTANCE_TYPE=platform).
 */

import { apiFetch, buildApiUrl } from '@/utils/api'
import { setWorkspaceApiUrlOverride } from '@/utils/apiUrls'
import { setWorkspaceRefreshToken, setWorkspaceToken } from '@/utils/authTokens'

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

// API functions

export async function getMyWorkspaces(): Promise<WorkspaceMembership[]> {
  const url = buildApiUrl('/platform/me/workspaces/')
  const data = await apiFetch<{ results: WorkspaceMembership[]; count: number }>(url)
  return data.results
}

export async function tokenExchange(workspaceId: number): Promise<TokenExchangeResponse> {
  const url = buildApiUrl('/platform/auth/token-exchange/')
  return apiFetch<TokenExchangeResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ workspace_id: workspaceId }),
  })
}

/**
 * Post-login routing for Platform instances.
 * Checks user's workspaces and auto-enters if only one exists.
 *
 * @param routerPush - router.push function
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
      const result = await tokenExchange(ws.workspace_id)

      setWorkspaceApiUrlOverride(result.workspace_url)
      setWorkspaceToken(result.workspace_token)
      setWorkspaceRefreshToken(result.workspace_refresh)
      localStorage.setItem('workspace_id', String(ws.workspace_id))

      routerPush('/admin')
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
