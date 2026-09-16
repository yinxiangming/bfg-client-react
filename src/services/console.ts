/**
 * The console's view of the workspaces a person runs: the extensions each one uses, what
 * it has metered this month, and the invoices it has been sent.
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

// Usage and bills

/** What one meter recorded: how much of it ran, and what that came to in points. */
export interface ConsoleUsageMeter {
  /** The meter's key, which is whatever the extension that records it calls itself. */
  meter: string
  quantity: string
  points: string
}

/** A meter's total for the month, with the points priced in the workspace's currency. */
export interface ConsoleUsageMeterTotal extends ConsoleUsageMeter {
  /** null when there was no rate to convert the points with. */
  amount: string | null
}

export interface ConsoleUsageDay {
  /** `YYYY-MM-DD`. */
  day: string
  points: string
  meters: ConsoleUsageMeter[]
}

/**
 * One workspace's metered usage for one month.
 *
 * Points are what the platform counts; `cap_points` is how many the workspace may spend
 * before metered features stop. Every figure arrives as a decimal string, points with
 * eight places and money with the currency's own.
 */
export interface ConsoleUsage {
  /** `YYYY-MM`, the month these figures cover. */
  month: string
  currency: string
  cap_points: string
  used_points: string
  remaining_points: string
  /** The used points in `currency`; null when no rate could be found. */
  estimated_amount: string | null
  /** An invoice is past due, so metered features are paused until it is paid. */
  overdue: boolean
  meters: ConsoleUsageMeterTotal[]
  days: ConsoleUsageDay[]
}

export interface ConsoleInvoiceItem {
  description: string
  quantity: string
  unit_price: string
  subtotal: string
}

export interface ConsoleInvoice {
  id: number
  number: string
  /** `YYYY-MM`, the month the invoice bills for. */
  period: string
  issue_date: string
  due_date: string
  /** The server's own word for it, such as `sent` or `paid`; read it with `invoiceState`. */
  status: string
  paid_date: string | null
  overdue: boolean
  currency: string
  subtotal: string
  tax: string
  total: string
  items: ConsoleInvoiceItem[]
}

/** How an invoice reads to the person who owes it. */
export type ConsoleInvoiceState = 'paid' | 'overdue' | 'unpaid'

/**
 * Paid wins over past due, because an invoice settled late is settled; anything the
 * server has not called paid and has not flagged is simply still owed.
 */
export function invoiceState(invoice: ConsoleInvoice): ConsoleInvoiceState {
  if (invoice.status === 'paid' || invoice.paid_date) return 'paid'

  return invoice.overdue ? 'overdue' : 'unpaid'
}

/**
 * An amount next to its currency, exactly as the server rounded it.
 *
 * Money arrives as a decimal string and is printed as it arrived: a round trip through a
 * float can move the last cent, and nothing on these pages is ever added up here — every
 * total, tax and estimate is the server's. The code rather than a symbol, because the
 * bills page puts several workspaces on one table and `$` would not say which dollar.
 */
export function formatMoney(amount: string, currency: string): string {
  return `${currency} ${amount}`
}

/** One workspace's metered usage; `month` is `YYYY-MM`, and omitting it means this month. */
export async function getWorkspaceUsage(id: number, month?: string): Promise<ConsoleUsage> {
  const query = month ? `?${new URLSearchParams({ month })}` : ''

  return apiFetch<ConsoleUsage>(buildApiUrl(`${BASE}${id}/usage/${query}`))
}

/** Every invoice raised against one workspace, newest first as the server orders them. */
export async function listWorkspaceInvoices(id: number): Promise<ConsoleInvoice[]> {
  const payload = await apiFetch<Page<ConsoleInvoice> | ConsoleInvoice[]>(buildApiUrl(`${BASE}${id}/invoices/`))

  return Array.isArray(payload) ? payload : payload.results ?? []
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
