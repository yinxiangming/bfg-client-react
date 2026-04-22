/**
 * Switch the active workspace for the authenticated user.
 *
 * Calls POST /api/v1/platform/switch-workspace/ which mints a new JWT
 * pair with the target workspace_id claim embedded. On success the new
 * tokens are persisted to localStorage so all subsequent API calls use
 * the new workspace context automatically.
 */

import { getPlatformApiBaseUrl } from './apiUrls'
import { getWorkspaceToken, setWorkspaceToken, setWorkspaceRefreshToken } from './authTokens'

export interface SwitchWorkspaceResult {
  access: string
  refresh: string
  workspace: {
    id: number
    slug: string
    name: string
  }
}

export class WorkspaceSwitchError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'WorkspaceSwitchError'
  }
}

/**
 * Switch to the given workspace and persist the new JWT tokens.
 *
 * @throws WorkspaceSwitchError on 403 (not a member), 404 (workspace not found / inactive), or network errors.
 */
export async function switchWorkspace(workspaceId: number): Promise<SwitchWorkspaceResult> {
  const baseUrl = getPlatformApiBaseUrl()
  const accessToken = getWorkspaceToken()

  const resp = await fetch(`${baseUrl}/api/v1/platform/switch-workspace/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ workspace_id: workspaceId }),
  })

  const data = await resp.json().catch(() => ({}))

  if (!resp.ok) {
    const code = (data as { code?: string }).code ?? 'unknown_error'
    const detail = (data as { detail?: string }).detail ?? `HTTP ${resp.status}`
    throw new WorkspaceSwitchError(detail, code, resp.status)
  }

  const result = data as SwitchWorkspaceResult
  setWorkspaceToken(result.access)
  setWorkspaceRefreshToken(result.refresh)
  return result
}
