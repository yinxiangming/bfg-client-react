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
/**
 * What an add-on the platform sells would cost this workspace.
 *
 * `amount` is the plan's own price in the currency the platform prices in, and
 * `workspace_amount` the same period converted into the workspace's own currency —
 * null when no exchange rate has been stored for the pair, in which case the price is
 * still shown in the platform's currency rather than not at all.
 *
 * `trial_days` is what *this* workspace would get, so it is 0 for an add-on it has held
 * before: a trial is had once.
 */
export interface ConsoleExtensionPrice {
  /** The name of the plan that prices it, as the platform wrote it. */
  plan: string
  amount: string
  currency: string
  workspace_amount: string | null
  workspace_currency: string
  /** `day` | `week` | `month` | `year`, and how many of them one price covers. */
  interval: string
  interval_count: number
  trial_days: number
}

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
  /**
   * What it costs, for an add-on the platform prices. Null for one that comes with the
   * base plan and for one nobody has priced, which read differently: the first is
   * included, the second is not for sale yet.
   */
  price?: ConsoleExtensionPrice | null
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
  /**
   * Whether the workspace may use this extension at all: always true for one that comes
   * with the base plan, and for an add-on only while a live entitlement covers it. A
   * deployment that sells nothing calls every extension entitled.
   *
   * Optional, and absent is read as entitled: a server from before any of this was sold
   * does not send it, and has nothing to acquire an extension through either.
   */
  entitled?: boolean
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
  /** A soft deletion is pending; it must be explicitly cancelled before its deadline. */
  scheduled_deletion_at?: string | null
  created_at: string
  /** Hostnames, the primary one first. */
  domains: string[]
  owner: ConsoleChanger | null
  owned_by_viewer: boolean
  staff_count: number
  /** Keys of the extensions the workspace has switched on. */
  active_extensions: string[]
  cluster?: { id: string; name: string; region: string; is_active: boolean } | null
}

/** Which optional workspace-management capabilities the current deployment supports. */
export interface ConsoleWorkspaceCapabilities {
  extension_management: boolean
  usage: boolean
}

export interface ConsoleWorkspaceDetail extends ConsoleWorkspace {
  extensions: ConsoleExtension[]
  /** Missing on an older Platform response; callers must treat that as unavailable. */
  capabilities?: ConsoleWorkspaceCapabilities
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

export async function suspendConsoleWorkspace(id: number, reason: string): Promise<ConsoleWorkspace> {
  return apiFetch<ConsoleWorkspace>(buildApiUrl(`${BASE}${id}/suspend/`), { method: 'POST', body: JSON.stringify({ confirm: true, reason }) })
}

export async function resumeConsoleWorkspace(id: number, reason: string): Promise<ConsoleWorkspace> {
  return apiFetch<ConsoleWorkspace>(buildApiUrl(`${BASE}${id}/resume/`), { method: 'POST', body: JSON.stringify({ confirm: true, reason }) })
}

export async function deleteConsoleWorkspace(id: number, reason: string): Promise<ConsoleWorkspace> {
  return apiFetch<ConsoleWorkspace>(buildApiUrl(`${BASE}${id}/delete/`), { method: 'POST', body: JSON.stringify({ confirm: true, reason }) })
}

export async function restoreConsoleWorkspace(id: number, reason: string): Promise<ConsoleWorkspace> {
  return apiFetch<ConsoleWorkspace>(buildApiUrl(`${BASE}${id}/restore/`), { method: 'POST', body: JSON.stringify({ confirm: true, reason }) })
}

export async function exportConsoleWorkspace(id: number, reason: string): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(buildApiUrl(`${BASE}${id}/export/`), {
    method: 'POST',
    body: JSON.stringify({ confirm: true, reason })
  })
}

export async function importConsoleWorkspace(payload: Record<string, unknown>, reason: string): Promise<ConsoleWorkspace> {
  return apiFetch<ConsoleWorkspace>(buildApiUrl(`${BASE}import-workspace/`), {
    method: 'POST',
    headers: { 'X-Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ ...payload, confirm: true, reason })
  })
}

export async function resetConsoleAdminPassword(id: number, reason: string, email?: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(buildApiUrl(`${BASE}${id}/reset-admin-password/`), {
    method: 'POST',
    headers: { 'X-Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ ...(email ? { email } : {}), confirm: true, reason })
  })
}

function createIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()

  return `platform-action-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/** A lifecycle operation the Platform has performed for one workspace. */
export interface ConsoleWorkspaceOperation {
  id: string
  operation: 'create' | 'suspend' | 'resume' | 'migrate' | 'delete'
  status: 'pending' | 'running' | 'completed' | 'failed'
  initiated_by: ConsoleChanger | null
  /** Audit-safe operation metadata. Worker exception text is intentionally never sent. */
  details: Record<string, unknown>
  error: string | null
  started_at: string
  completed_at: string | null
}

/** Recent lifecycle operations for a Platform-superuser-managed workspace. */
export async function listConsoleWorkspaceOperations(id: number, limit = 10): Promise<ConsoleWorkspaceOperation[]> {
  return apiFetch<ConsoleWorkspaceOperation[]>(buildApiUrl(`${BASE}${id}/operations/?limit=${limit}`))
}

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

export interface ConsoleWorkspaceQuery {
  /** Matches a workspace name or slug. */
  search?: string
  status?: ConsoleWorkspaceStatus
  /** Exact Cluster identifier. */
  cluster?: string
}

/** The workspaces the signed-in account reaches, newest first, with optional inventory filters. */
export async function listConsoleWorkspaces(filters: ConsoleWorkspaceQuery = {}): Promise<ConsoleWorkspaceList> {
  const term = filters.search?.trim()
  const status = filters.status?.trim()
  const cluster = filters.cluster?.trim()
  const query = new URLSearchParams({ page_size: String(PAGE_SIZE) })

  if (term) query.set('search', term)
  if (status) query.set('status', status)
  if (cluster) query.set('cluster', cluster)

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

/**
 * The tenant-safe workspace contract for an owner or member. Platform console routes
 * deliberately remain Django-superuser-only and must never be used as an owner fallback.
 */
export async function getOwnerWorkspace(id: number): Promise<ConsoleWorkspaceDetail> {
  return apiFetch<ConsoleWorkspaceDetail>(buildApiUrl(`/platform/workspaces/${id}/`))
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

/**
 * The bill for an add-on that costs something, in the shape the bills page reads.
 *
 * `issued` is false when the workspace was already holding this bill unpaid: asking for
 * the same add-on twice is billed once, and the second answer carries the first bill.
 */
export interface ConsoleAcquireInvoice extends ConsoleInvoice {
  issued: boolean
}

/**
 * What asking for an add-on came to.
 *
 * One the deployment prices at nothing is entitled and switched on in the same breath,
 * and there is no `invoice`. A priced one is billed and nothing else is written until
 * the money arrives: it is not entitled, and `extension` is as it was. Either way
 * `extension` is how the extension now stands, so the card is put straight from it.
 *
 * A priced one is also switched on with no bill in two cases, and then `entitled` is
 * true, `invoice` is null, and one of two fields says why: `trial_days` for a plan whose
 * trial this workspace has not had, and `billed_later` when the platform had no exchange
 * rate to write today's bill at. Neither is an add-on given away — both are periods the
 * monthly bill charges for — so the reader is told a bill is coming.
 */
export interface ConsoleAcquireResult {
  entitled: boolean
  invoice: ConsoleAcquireInvoice | null
  extension: ConsoleExtension
  /** How long the trial runs, and 0 when this was not one. Absent on an older server. */
  trial_days?: number
  /** Whether the first period was written ahead of its bill. Absent on an older server. */
  billed_later?: boolean
  /** When the period written now runs out; null for one that does not expire. */
  entitled_until?: string | null
}

/**
 * Ask for an add-on: it is either given and switched on, or billed for.
 *
 * Refused with 400 and a `code` — `already_entitled`, `not_an_addon`, `no_plan`, or one
 * of the reasons no bill could be written; read it with `getConsoleErrorCode`.
 */
export async function acquireExtension(workspaceId: number, key: string): Promise<ConsoleAcquireResult> {
  return apiFetch<ConsoleAcquireResult>(buildApiUrl(`${BASE}${workspaceId}/extensions/${key}/acquire/`), {
    method: 'POST',
    body: '{}'
  })
}

/** An extension sold on top of the base plan, rather than bundled with it. */
const PRICING_ADDON = 'addon'

/**
 * Whether the workspace has to acquire this extension before it can use it.
 *
 * Only an add-on is ever acquired, and only while no entitlement covers it — which is
 * an add-on that has never been had, and one paused when its entitlement ran out. An
 * extension that does not say either way is taken as entitled, so nothing is offered
 * for acquiring against a server that cannot acquire it.
 */
export function needsAcquiring(extension: ConsoleExtension): boolean {
  return extension.pricing === PRICING_ADDON && extension.entitled === false
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
  /** Both can be empty: a bill can be issued without either date. */
  issue_date: string | null
  due_date: string | null
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

/**
 * The gateway the server picked to take this payment.
 *
 * `type` is the gateway plugin's own word for itself — `stripe`, `bank_transfer`,
 * `pay_in_store`, `custom`, or whatever else a deployment has installed — and the caller
 * decides what to put in front of the payer from that.
 */
export interface ConsolePaymentGateway {
  id: number
  type: string
  name: string
  /**
   * What this gateway publishes to whoever is paying: an account to transfer to, a
   * publishable key, a note. The same set the checkout page is given, so nothing here is
   * secret — a gateway keeps its credentials to itself.
   */
  instructions: Record<string, unknown>
}

/**
 * The attempt opened against the invoice.
 *
 * `status` is `pending` on every answer. Asking to pay is not paying: a card is settled
 * when the gateway calls back, and money sent offline when whoever reconciles it says so.
 */
export interface ConsoleInvoicePayment {
  id: number
  number: string
  status: string
  amount: string
  currency: string
}

/** How the invoice stands now — a summary, not the whole record the list carries. */
export interface ConsolePayableInvoice {
  id: number
  number: string
  status: string
  total: string
  currency: string
  due_date: string | null
}

export interface ConsolePayInvoiceResult {
  invoice: ConsolePayableInvoice
  payment: ConsoleInvoicePayment
  gateway: ConsolePaymentGateway
  /** The gateway's own half of it: Stripe sends `payment_intent_id` and `client_secret`. */
  gateway_payload: Record<string, unknown>
}

/**
 * Open a payment against one platform invoice, by its number.
 *
 * Which gateway takes it is the server's to decide and not the payer's to choose: a
 * workspace cannot read the platform's gateways at all, so there is nothing to offer and
 * no gateway is sent. A suspended workspace may still pay — that is when it most needs
 * to. Refused with a `code`: `invoice_already_paid`, `payment_in_progress` and the rest;
 * read it with `getConsoleErrorCode`.
 */
export async function payWorkspaceInvoice(
  workspaceId: number,
  invoiceNumber: string
): Promise<ConsolePayInvoiceResult> {
  return apiFetch<ConsolePayInvoiceResult>(
    buildApiUrl(`${BASE}${workspaceId}/invoices/${encodeURIComponent(invoiceNumber)}/pay/`),
    { method: 'POST', body: '{}' }
  )
}

/**
 * One entry of a gateway's `instructions` or `gateway_payload`, when it is text worth
 * showing. Anything a gateway sends as a flag, a number or a structure is not something a
 * page can put in front of a payer without knowing that gateway, so it reads as absent.
 */
export function gatewayText(bag: Record<string, unknown>, key: string): string {
  const value = bag[key]

  return typeof value === 'string' ? value.trim() : ''
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
