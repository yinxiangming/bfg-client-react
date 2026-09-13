/**
 * Platform API service
 *
 * Handles workspace listing, Token Exchange, and post-login routing
 * for Platform instances (BFG_INSTANCE_TYPE=platform), plus creating
 * and editing the user's own workspaces.
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

/** `inactive`: deactivated without a suspension record. */
export type TenantWorkspaceStatus = 'active' | 'suspended' | 'inactive'

/** A workspace as listed by GET /platform/workspaces/me/ and returned by POST /platform/workspaces/. */
export interface TenantWorkspace {
  id: number
  name: string
  slug: string
  created_at: string
  /** Primary domain hostname, or null when there is none. */
  domain: string | null
  status: TenantWorkspaceStatus
  suspended_at: string | null
  /** The user's staff role code here; null when the owner is not active staff. */
  role: string | null
  /** The user is active staff here, so the workspace can be switched into. */
  is_member: boolean
  /** The user owns the workspace; only owners may edit its details. */
  is_owner: boolean
  // Reserved for billing: the server sends null, null and [] until it fills them in.
  plan: unknown | null
  credits: unknown | null
  extensions: unknown[]
}

/** Why GET /platform/workspaces/me/ says the user cannot create a workspace right now. */
export type TenantWorkspaceCreateBlocked = 'workspace_create_forbidden' | 'workspace_limit_reached'

export interface TenantWorkspacesResponse {
  is_platform_admin: boolean
  workspaces: TenantWorkspace[]
  /** How many workspaces one account may own, suspended and inactive ones included. */
  workspace_limit: number
  /** null when a create request would go ahead now, else the code it would be refused with. */
  create_blocked: TenantWorkspaceCreateBlocked | null
}

export interface CreateTenantWorkspaceInput {
  name: string
  /** Empty or omitted: the server generates one. */
  slug?: string
  // Omitted: the server copies each one from the workspace the access token belongs to, while
  // the user still works there or owns it, and otherwise uses its defaults.
  country?: string
  currency?: string
  language?: string
}

/** The details a workspace owner can change. */
export interface WorkspaceDetailsPatch {
  name?: string
  email?: string
  phone?: string
}

/** Error codes the tenant workspace endpoints send as `{ detail, code }`. */
export type TenantWorkspaceErrorCode =
  | 'workspace_create_forbidden'
  | 'workspace_limit_reached'
  | 'workspace_owner_required'

export interface TenantWorkspaceErrorMessage {
  code: TenantWorkspaceErrorCode
  /** Key in the `common` messages namespace. */
  key: string
  values?: { limit: number }
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

/** Workspaces the user is active staff in, and so can switch into. */
export async function getMyWorkspaces(): Promise<WorkspaceMembership[]> {
  const url = buildApiUrl('/platform/workspaces/me/')
  const data = await apiFetch<{ workspaces?: Array<Record<string, unknown> & { id: number }> }>(url)
  // me/ also lists workspaces the user owns without being staff there (is_member: false).
  // Servers that predate is_member leave it out, so only an explicit false is dropped.
  return mapMeWorkspacesPayload({
    workspaces: data.workspaces?.filter((w) => w.is_member !== false),
  })
}

/** The user's workspaces, staff in or owned, and whether the user is a platform admin. */
export async function listTenantWorkspaces(): Promise<TenantWorkspacesResponse> {
  const url = buildApiUrl('/platform/workspaces/me/')
  return apiFetch<TenantWorkspacesResponse>(url)
}

/**
 * Create a workspace owned by the user.
 * Fails with workspace_create_forbidden or workspace_limit_reached; see getTenantWorkspaceErrorMessage().
 */
export async function createTenantWorkspace(input: CreateTenantWorkspaceInput): Promise<TenantWorkspace> {
  const url = buildApiUrl('/platform/workspaces/')
  return apiFetch<TenantWorkspace>(url, {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      slug: input.slug ?? '',
      country: input.country,
      currency: input.currency,
      language: input.language,
    }),
  })
}

/**
 * Change a workspace's name, email or phone. Owners only: anyone else gets
 * workspace_owner_required. The response body is not used; read the change
 * back with listTenantWorkspaces().
 */
export async function updateWorkspace(id: number, patch: WorkspaceDetailsPatch): Promise<void> {
  const url = buildApiUrl(`/platform/workspaces/${id}/`)
  // Send only the editable fields; the server refuses domain with a 400.
  await apiFetch<unknown>(url, {
    method: 'PATCH',
    body: JSON.stringify({ name: patch.name, email: patch.email, phone: patch.phone }),
  })
}

/** Message key in the `common` namespace for each tenant workspace error code. */
export const TENANT_WORKSPACE_ERROR_KEYS: Record<TenantWorkspaceErrorCode, string> = {
  workspace_create_forbidden: 'workspaces.errors.createForbidden',
  workspace_limit_reached: 'workspaces.errors.limitReached',
  workspace_owner_required: 'workspaces.errors.ownerRequired',
}

/**
 * Turn an error thrown by the tenant workspace calls into a message:
 * `useTranslations('common')`, then `t(message.key, message.values)`.
 *
 * apiFetch keeps the response body on `validationErrors`, which carries the
 * code and, for workspace_limit_reached, the limit. Returns null for any
 * other error; fall back to its `message`.
 */
export function getTenantWorkspaceErrorMessage(error: unknown): TenantWorkspaceErrorMessage | null {
  const body = (error as { validationErrors?: Record<string, unknown> } | null)?.validationErrors
  return getTenantWorkspaceCodeMessage(body?.code, body?.limit)
}

/**
 * The message for a tenant workspace error code, with the limit for workspace_limit_reached.
 * getTenantWorkspaceErrorMessage() reads both from an error's response body; me/ reports
 * them as create_blocked and workspace_limit. Returns null for any other code.
 */
export function getTenantWorkspaceCodeMessage(code: unknown, limit?: unknown): TenantWorkspaceErrorMessage | null {
  switch (code) {
    case 'workspace_create_forbidden':
    case 'workspace_owner_required':
      return { code, key: TENANT_WORKSPACE_ERROR_KEYS[code] }
    case 'workspace_limit_reached':
      // The message names the limit; without a number, use the one that doesn't.
      return typeof limit === 'number'
        ? { code, key: TENANT_WORKSPACE_ERROR_KEYS[code], values: { limit } }
        : { code, key: 'workspaces.errors.limitReachedGeneric' }
    default:
      return null
  }
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
 * Called by /auth/sso page after redirect from platform.
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
 *   3. Workspace frontend /auth/sso exchanges code for JWT
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
