/**
 * The console's view of the workspaces a person runs, and of the extensions each one uses.
 *
 * It is backed by `/api/v1/platform/console/workspaces/`, which answers platform
 * administrators for every workspace and owners for the ones they own; anyone else is
 * refused. A workspace the caller cannot reach answers 404 `workspace_not_found`, exactly
 * as one that does not exist. An owner may only read a suspended or inactive workspace:
 * changing its extensions answers 403 `workspace_suspended` or `workspace_inactive`.
 */

import { apiFetch, buildApiUrl } from '@/utils/api'

/** Whoever last switched an extension on or off. */
export interface ConsoleChanger {
  id: number | null
  username: string | null
  /** Platform administrators only: an owner is never told a changer's email. */
  email?: string
  /** The change came from outside the workspace, so an owner is not told who made it. */
  by_platform?: boolean
}

/** The states a workspace's extension record can be in; see the server's WorkspaceExtension. */
export type ConsoleExtensionStatus =
  | 'active'
  | 'paused'
  | 'inactive'
  | 'archiving'
  | 'archived'
  | 'restoring'

/** One extension, as the console shows it for one workspace. */
export interface ConsoleExtension {
  key: string
  name: string
  name_zh: string
  description: string
  description_zh: string
  /** Icon name the way the admin writes them, e.g. `tabler-map-pin`; empty without one. */
  icon: string
  /** Path of the extension's page in that workspace's admin; empty when it has none. */
  admin_url: string
  pricing: string
  surfaces: string[]
  requires: string[]
  meters: string[]
  config_schema: Record<string, unknown> | null
  status: ConsoleExtensionStatus
  status_reason: string
  status_changed_at: string | null
  status_changed_by: ConsoleChanger | null
  activated_at: string | null
  /** Switched on with everything it needs in place, so it is live for the workspace. */
  available: boolean
  /** What the workspace must put in place before this can be switched on. */
  unmet_prerequisites: string[]
  config: Record<string, unknown>
}

export interface ConsoleWorkspace {
  id: number
  name: string
  slug: string
  is_active: boolean
  is_platform: boolean
  suspended_at: string | null
  created_at: string
  /** Hostnames, the primary one first. */
  domains: string[]
  owner: ConsoleChanger | null
  owned_by_viewer: boolean
  staff_count: number
  /** Keys of the extensions the workspace has switched on. */
  active_extensions: string[]
}

export interface ConsoleWorkspaceDetail extends ConsoleWorkspace {
  extensions: ConsoleExtension[]
}

export type ConsoleWorkspaceStatus = 'active' | 'suspended' | 'inactive'

/** Suspended wins over inactive, as `suspend_workspace` leaves a workspace as both. */
export function consoleWorkspaceStatus(workspace: ConsoleWorkspace): ConsoleWorkspaceStatus {
  if (workspace.suspended_at) return 'suspended'

  return workspace.is_active ? 'active' : 'inactive'
}

/** DRF sends a page when the deployment sets a page size, and a bare array otherwise. */
type Page<T> = { count?: number; next?: string | null; results?: T[] }

export interface ConsoleWorkspaceList {
  workspaces: ConsoleWorkspace[]
  /** How many there are altogether, which is more than `workspaces` when the API pages. */
  count: number
  /** The next page's URL, which the API sends in full; null on the last page. */
  next: string | null
}

const BASE = '/platform/console/workspaces/'

/** As many workspaces as the deployment's pagination allows in one request. */
const PAGE_SIZE = 100

function toList(payload: Page<ConsoleWorkspace> | ConsoleWorkspace[]): ConsoleWorkspaceList {
  const workspaces = Array.isArray(payload) ? payload : payload.results ?? []

  return {
    workspaces,
    count: Array.isArray(payload) ? payload.length : payload.count ?? workspaces.length,
    next: Array.isArray(payload) ? null : payload.next ?? null
  }
}

/** The workspaces the signed-in account reaches, newest first; `search` matches name or slug. */
export async function listConsoleWorkspaces(search?: string): Promise<ConsoleWorkspaceList> {
  const term = search?.trim()
  const query = new URLSearchParams({ page_size: String(PAGE_SIZE) })

  if (term) query.set('search', term)

  return toList(await apiFetch<Page<ConsoleWorkspace> | ConsoleWorkspace[]>(buildApiUrl(`${BASE}?${query}`)))
}

/** The next page of a list, from the URL the previous answer carried. */
export async function listMoreConsoleWorkspaces(next: string): Promise<ConsoleWorkspaceList> {
  return toList(await apiFetch<Page<ConsoleWorkspace> | ConsoleWorkspace[]>(next))
}

/** One workspace with every extension it can switch, each with its configuration. */
export async function getConsoleWorkspace(id: number): Promise<ConsoleWorkspaceDetail> {
  return apiFetch<ConsoleWorkspaceDetail>(buildApiUrl(`${BASE}${id}/`))
}

export async function activateExtension(workspaceId: number, key: string): Promise<ConsoleExtension> {
  return apiFetch<ConsoleExtension>(buildApiUrl(`${BASE}${workspaceId}/extensions/${key}/activate/`), {
    method: 'POST',
    body: '{}'
  })
}

export async function deactivateExtension(workspaceId: number, key: string): Promise<ConsoleExtension> {
  return apiFetch<ConsoleExtension>(buildApiUrl(`${BASE}${workspaceId}/extensions/${key}/deactivate/`), {
    method: 'POST',
    body: '{}'
  })
}

/** The business code a console refusal carries, such as `workspace_suspended`. */
export function getConsoleErrorCode(error: unknown): string | null {
  const body = (error as { validationErrors?: Record<string, unknown> } | null)?.validationErrors
  const code = body?.code

  return typeof code === 'string' ? code : null
}

/**
 * The extension keys a refusal names, which `requires_inactive` and `required_by_active`
 * carry: the ones to switch on, or off, before this change can go through.
 */
export function getConsoleErrorKeys(error: unknown, field: 'requires' | 'required_by'): string[] {
  const body = (error as { validationErrors?: Record<string, unknown> } | null)?.validationErrors
  const keys = body?.[field]

  return Array.isArray(keys) ? keys.filter((key): key is string => typeof key === 'string') : []
}

export function getConsoleErrorStatus(error: unknown): number | null {
  const status = (error as { status?: number } | null)?.status

  return typeof status === 'number' ? status : null
}

/** An extension's name in the reader's language, falling back to the English one. */
export function extensionName(extension: ConsoleExtension, locale: string): string {
  return locale.startsWith('zh') && extension.name_zh ? extension.name_zh : extension.name
}

export function extensionDescription(extension: ConsoleExtension, locale: string): string {
  return locale.startsWith('zh') && extension.description_zh ? extension.description_zh : extension.description
}
