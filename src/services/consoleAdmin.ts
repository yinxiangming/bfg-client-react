/**
 * The half of the console only the people who run the deployment may use.
 *
 * `console.ts` is shared with workspace owners and is about one workspace.
 * This is the other half: the numbers every workspace on the deployment is
 * billed by — what a platform variable is set to, what a meter costs, what a
 * currency was worth on a day — and the two things decided for a single
 * workspace that its owner may not decide, its monthly usage cap and an
 * entitlement given rather than sold.
 *
 * Everything here answers 403 `platform_admin_required` for anyone else, and
 * 404 `workspace_not_found` for a workspace id that is not one. Read a refusal
 * with `getConsoleErrorCode` and `getConsoleErrorStatus` from `console.ts`.
 *
 * Every number money is worked out from arrives as a decimal string and is
 * sent back as one: JSON has no decimal, and a margin or a rate that went
 * through a float would come back a fraction out of what was typed. Whole
 * numbers and true/false are themselves.
 */

import { apiFetch, buildApiUrl } from '@/utils/api'

import type { ConsoleChanger } from './console'

// Deployment configuration is intentionally separate from the owner console.
// Every route under this prefix is enforced by Django's superuser flag.
const BASE = '/platform/control/'

/** Everyone who is not a platform administrator is refused with this code. */
export const PLATFORM_ADMIN_REQUIRED = 'platform_admin_required'

// ── Clusters ─────────────────────────────────────────────────────────

/** One deployment cluster that can host tenant workspaces. */
export interface ConsoleCluster {
  id: string
  name: string
  region: 'us' | 'eu' | 'apac'
  api_base_url: string
  frontend_base_url: string
  db_host: string
  db_port: number
  /** A stored Redis endpoint exists; its value is write-only. */
  redis_configured: boolean
  s3_bucket: string
  max_workspaces: number
  /** Monotonic version required for a safe shared-configuration update. */
  config_version: number
  /** Computed from the assigned workspace profiles, rather than a stale counter. */
  workspace_count: number
  capacity_percentage: number
  is_accepting_new: boolean
  is_active: boolean
  health_status: 'unknown' | 'healthy' | 'degraded' | 'down'
  last_health_check: string | null
  created_at: string
  updated_at: string
}

/** The editable configuration needed to create or maintain one cluster. */
export interface ConsoleClusterInput {
  id?: string
  name: string
  region: ConsoleCluster['region']
  api_base_url: string
  frontend_base_url: string
  db_host: string
  db_port: number
  redis_url: string
  s3_bucket: string
  max_workspaces: number
  is_accepting_new: boolean
  is_active: boolean
}

const CLUSTERS_BASE = '/platform/control/clusters/'

export async function listConsoleClusters(): Promise<ConsoleCluster[]> {
  return apiFetch<ConsoleCluster[]>(buildApiUrl(CLUSTERS_BASE))
}

export async function createConsoleCluster(
  input: Required<Pick<ConsoleClusterInput, 'id'>> & ConsoleClusterInput,
  reason: string
): Promise<ConsoleCluster> {
  return apiFetch<ConsoleCluster>(buildApiUrl(CLUSTERS_BASE), {
    method: 'POST',
    headers: { 'X-Platform-Change-Reason': reason, 'X-Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ ...input, confirm: true })
  })
}

export async function updateConsoleCluster(
  id: string,
  input: Partial<ConsoleClusterInput>,
  reason: string,
  expectedVersion: number
): Promise<ConsoleCluster> {
  return apiFetch<ConsoleCluster>(buildApiUrl(`${CLUSTERS_BASE}${encodeURIComponent(id)}/`), {
    method: 'PATCH',
    headers: { 'X-Platform-Change-Reason': reason, 'X-Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ ...input, expected_version: expectedVersion, confirm: true })
  })
}

/** Run the restricted server-side health probe for one configured Cluster. */
export async function checkConsoleClusterHealth(id: string, reason: string): Promise<ConsoleCluster> {
  return apiFetch<ConsoleCluster>(buildApiUrl(`${CLUSTERS_BASE}${encodeURIComponent(id)}/health-check/`), {
    method: 'POST',
    headers: { 'X-Platform-Change-Reason': reason, 'X-Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ confirm: true })
  })
}

// ── Audit history ────────────────────────────────────────────────────

/** One completed sensitive action from the Platform control plane. */
export interface ConsoleAuditEvent {
  id: string
  action: string
  target: { type: string; id: string }
  reason: string
  /** Final server-side outcome, without secured exception detail. */
  result: string
  /** The operator identity is limited to a username; request IPs are never exposed. */
  actor: { id: number; username: string } | null
  /** Snapshots are server-redacted again before being sent to the browser. */
  before: Record<string, unknown>
  after: Record<string, unknown>
  created_at: string
}

export interface ConsoleAuditEventPage {
  results: ConsoleAuditEvent[]
  /** An opaque, signed cursor; null when there are no more entries. */
  next: string | null
}

export interface ConsoleAuditEventQuery {
  action?: string
  targetType?: string
  targetId?: string
  cursor?: string
  limit?: number
}

const AUDIT_EVENTS_BASE = '/platform/control/audit-events/'

/** Read a bounded page of Platform audit history. This endpoint is superuser-only. */
export async function listConsoleAuditEvents(query: ConsoleAuditEventQuery = {}): Promise<ConsoleAuditEventPage> {
  const params = new URLSearchParams()
  if (query.action?.trim()) params.set('action', query.action.trim())
  if (query.targetType?.trim()) params.set('target_type', query.targetType.trim())
  if (query.targetId?.trim()) params.set('target_id', query.targetId.trim())
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.limit) params.set('limit', String(query.limit))
  const search = params.toString()

  return apiFetch<ConsoleAuditEventPage>(buildApiUrl(`${AUDIT_EVENTS_BASE}${search ? `?${search}` : ''}`))
}

// ── Platform variables ───────────────────────────────────────────────

/** How a variable's value is written: a decimal arrives as a string, the rest as themselves. */
export type ConsoleVariableKind = 'decimal' | 'int' | 'bool'

/** A variable's value, in whichever of the three shapes its kind is written in. */
export type ConsoleVariableValue = string | number | boolean

/** One change out of a variable's trail, with the reason its author gave. */
export interface ConsoleVariableChange {
  old_value: ConsoleVariableValue | null
  new_value: ConsoleVariableValue | null
  reason: string
  changed_at: string | null
  changed_by: ConsoleChanger | null
}

/**
 * One of the deployment's own numbers.
 *
 * `value` is what everything reads right now and `default` what it would be
 * with nothing set; `overridden` says which of the two `value` came from. A
 * variable nobody has ever changed still appears, at its default, so the list
 * says what can be set rather than only what has been.
 */
export interface ConsolePlatformVariable {
  key: string
  kind: ConsoleVariableKind
  description: string
  default: ConsoleVariableValue
  value: ConsoleVariableValue
  overridden: boolean
  updated_at: string | null
  updated_by: ConsoleChanger | null
  last_change: ConsoleVariableChange | null
}

/** Every variable the deployment declares, in key order. */
export async function listPlatformVariables(): Promise<ConsolePlatformVariable[]> {
  return apiFetch<ConsolePlatformVariable[]>(buildApiUrl(`${BASE}variables/`))
}

/**
 * Override one variable, saying why.
 *
 * A reason is required: these are the numbers bills are calculated from, and a
 * change is kept for as long as the bills it explains. Refused with 404
 * `unknown_platform_variable`, or 400 `invalid_platform_variable` or
 * `reason_required`.
 */
export async function setPlatformVariable(
  key: string,
  value: ConsoleVariableValue,
  reason: string
): Promise<ConsolePlatformVariable> {
  return apiFetch<ConsolePlatformVariable>(buildApiUrl(`${BASE}variables/${encodeURIComponent(key)}/`), {
    method: 'PATCH',
    headers: { 'X-Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ value, reason, confirm: true })
  })
}

// ── What each meter costs ────────────────────────────────────────────

/**
 * One price a meter has carried.
 *
 * `margin` is what this row itself names, and null for one that follows the
 * deployment's own margin — which is not the same as naming that same share by
 * hand, since the first moves when the deployment's does. `effective_margin`
 * is the share that actually applies either way, and `uses_default_margin`
 * says which of the two it is.
 */
export interface ConsoleMeterPrice {
  id: number
  /** What the vendor charges for one `unit_size` of the meter. */
  vendor_cost: string
  /** How many calls or tokens the vendor cost buys. */
  unit_size: number
  margin: string | null
  effective_margin: string
  uses_default_margin: boolean
  /** Points one call or token is billed at, margin included. */
  points_per_unit: string
  effective_from: string | null
  created_at: string | null
  in_force: boolean
}

/**
 * One meter's whole price history, newest first.
 *
 * `in_force` is the id of the price a call would be billed at right now, and
 * null for a meter whose every price starts later — which is what a price
 * entered with the wrong date looks like, and until one starts nothing is
 * billed for it at all.
 */
export interface ConsoleMeterPrices {
  meter: string
  in_force: number | null
  prices: ConsoleMeterPrice[]
}

/** Meter keys with a verified server-side usage enforcement point. */
export interface ConsoleRuntimeMeterResponse {
  meters: string[]
}

/** What a new price says. `margin` left out follows the deployment's own. */
export interface ConsoleMeterPriceInput {
  meter: string
  vendor_cost: string
  unit_size: string
  margin?: string
  effective_from?: string
}

/** Every meter's price history, or one meter's when `meter` is given. */
export async function listMeterPrices(meter?: string): Promise<ConsoleMeterPrices[]> {
  const query = meter ? `?${new URLSearchParams({ meter })}` : ''

  return apiFetch<ConsoleMeterPrices[]>(buildApiUrl(`${BASE}meter-prices/${query}`))
}

/** Meter keys that Platform can safely price in this deployment. */
export async function listRuntimeMeters(): Promise<string[]> {
  const response = await apiFetch<ConsoleRuntimeMeterResponse>(
    buildApiUrl(`${BASE}meter-prices/available-meters/`)
  )

  return response.meters
}

/**
 * Price a meter from a moment on, without touching what it cost before.
 *
 * Prices are only ever added — there is no way to edit or delete one — so that
 * a bill already issued can still be explained by the row it was calculated
 * from. The answer is the whole meter rather than the row written, because a
 * price dated behind one that already exists changes nothing today and the
 * answer says which row is in force. `idempotencyKey` must remain stable while
 * retrying one save, so a lost response cannot append the same price twice.
 */
export async function addMeterPrice(price: ConsoleMeterPriceInput, idempotencyKey: string): Promise<ConsoleMeterPrices> {
  return apiFetch<ConsoleMeterPrices>(buildApiUrl(`${BASE}meter-prices/`), {
    method: 'POST',
    headers: { 'X-Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ ...price, confirm: true })
  })
}

// ── Exchange rates ───────────────────────────────────────────────────

/** Where a rate came from: read from the reference feed, or typed in by hand. */
export type ConsoleRateSource = 'feed' | 'manual'

export interface ConsoleExchangeRate {
  id: number
  from: string
  to: string
  rate: string
  /** `YYYY-MM-DD`, the day the rate applies to. */
  effective_date: string
  source: ConsoleRateSource
  /** Who typed it, for a rate that was not read from the feed. */
  entered_by: ConsoleChanger | null
}

export interface ConsoleExchangeRateInput {
  from: string
  to: string
  rate: string
  /** `YYYY-MM-DD`; today when left out. */
  effective_date?: string
}

/** How many rates the API sends when asked for no particular number. */
export const RATES_DEFAULT_LIMIT = 50

/** The most it will send however many are asked for. */
export const RATES_MAX_LIMIT = 200

export interface ConsoleExchangeRateQuery {
  /** Narrows to rates out of this currency. */
  base?: string
  /** Narrows to rates into this currency. */
  currency?: string
  limit?: number
}

/** The rates most recently stored, newest day first. */
export async function listExchangeRates(query: ConsoleExchangeRateQuery = {}): Promise<ConsoleExchangeRate[]> {
  const params = new URLSearchParams()

  if (query.base?.trim()) params.set('base', query.base.trim())
  if (query.currency?.trim()) params.set('currency', query.currency.trim())
  if (query.limit) params.set('limit', String(query.limit))

  const search = params.toString()

  return apiFetch<ConsoleExchangeRate[]>(buildApiUrl(`${BASE}exchange-rates/${search ? `?${search}` : ''}`))
}

/**
 * Enter a rate by hand, for a day the feed could not be read for.
 *
 * A stand-in rather than an override that sticks: the row records that it was
 * typed rather than published, a day already stored is corrected rather than
 * duplicated, and a later refresh that does reach the feed replaces it with the
 * published number. Refused with 400 `invalid_exchange_rate`.
 */
export async function setExchangeRate(rate: ConsoleExchangeRateInput): Promise<ConsoleExchangeRate> {
  return apiFetch<ConsoleExchangeRate>(buildApiUrl(`${BASE}exchange-rates/`), {
    method: 'POST',
    headers: { 'X-Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ ...rate, confirm: true })
  })
}

// ── One workspace's monthly usage cap ────────────────────────────────

/**
 * How many points of metered usage one workspace may run up in a month.
 *
 * `cap_points` is the workspace's own and is null for one that has none, which
 * is not a cap of zero: zero stops it metering anything at all, and null
 * follows `default_cap_points`. `effective_cap_points` is what is actually
 * enforced, and `source` says which of the two it came from.
 */
export interface ConsoleUsageCap {
  workspace: number
  cap_points: string | null
  default_cap_points: string
  effective_cap_points: string
  source: 'workspace' | 'platform'
}

export async function getWorkspaceUsageCap(workspaceId: number): Promise<ConsoleUsageCap> {
  return apiFetch<ConsoleUsageCap>(buildApiUrl(`${BASE}workspaces/${workspaceId}/usage-cap/`))
}

/**
 * Give a workspace a cap of its own, or null to put it back on the default.
 *
 * Refused with 400 `invalid_usage_cap`.
 */
export async function setWorkspaceUsageCap(workspaceId: number, capPoints: string | null): Promise<ConsoleUsageCap> {
  return apiFetch<ConsoleUsageCap>(buildApiUrl(`${BASE}workspaces/${workspaceId}/usage-cap/`), {
    method: 'PATCH',
    headers: { 'X-Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ cap_points: capPoints, confirm: true })
  })
}

function createIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()

  return `platform-config-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// ── Runtime feature entitlements ─────────────────────────────────────

export interface ConsoleEntitlement {
  id: number
  key: string
  status: string
  source: string
  starts_at: string | null
  /** When it runs out; null for one that does not expire. */
  current_period_end: string | null
  reason: string
  /** True only while the server's runtime gate will honor this grant. */
  is_effective: boolean
}

export interface ConsoleGrant {
  workspace: number
  entitlement: ConsoleEntitlement
}

/** Feature keys with a verified server-side entitlement gate. */
export interface ConsoleRuntimeEntitlementFeatures {
  features: string[]
}

/** What a grant says: what is being given, for how long, and why. */
export interface ConsoleGrantInput {
  /** A feature key returned by the Platform runtime-feature registry. */
  key: string
  /** How many months it runs. Exactly one of this and `never_expires`. */
  months?: number
  never_expires?: boolean
  reason: string
}

/** The longest grant that can be asked for in months; beyond that is `never_expires`. */
export const MAX_GRANT_MONTHS = 120

/**
 * Give a workspace an entitlement it has not bought.
 *
 * Refused with 400 `invalid_grant` for an invalid period/reason, 400
 * `unknown_entitlement_feature` for a key without a runtime gate, or 409
 * `already_entitled` for a workspace that already holds one.
 */
export async function grantEntitlement(workspaceId: number, grant: ConsoleGrantInput): Promise<ConsoleGrant> {
  return apiFetch<ConsoleGrant>(buildApiUrl(`${BASE}workspaces/${workspaceId}/grants/`), {
    method: 'POST',
    headers: { 'X-Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify({ ...grant, confirm: true })
  })
}

/** All historic and current Platform runtime feature grants for one workspace. */
export async function listEntitlements(workspaceId: number): Promise<ConsoleEntitlement[]> {
  return apiFetch<ConsoleEntitlement[]>(buildApiUrl(`${BASE}workspaces/${workspaceId}/grants/`))
}

/** Features that Platform can safely grant in this deployment. */
export async function listRuntimeEntitlementFeatures(workspaceId: number): Promise<string[]> {
  const response = await apiFetch<ConsoleRuntimeEntitlementFeatures>(
    buildApiUrl(`${BASE}workspaces/${workspaceId}/grants/available-features/`)
  )

  return response.features
}

/** Revoke a runtime feature grant while retaining it in the Platform audit trail. */
export async function revokeEntitlement(
  workspaceId: number,
  grantId: number,
  reason: string
): Promise<ConsoleGrant> {
  return apiFetch<ConsoleGrant>(
    buildApiUrl(`${BASE}workspaces/${workspaceId}/grants/${grantId}/revoke/`),
    {
      method: 'POST',
      headers: { 'X-Idempotency-Key': createIdempotencyKey() },
      body: JSON.stringify({ reason, confirm: true })
    }
  )
}

/** The entitlement an `already_entitled` refusal says the workspace already holds. */
export function getHeldEntitlement(error: unknown): ConsoleEntitlement | null {
  const held = (error as { validationErrors?: Record<string, unknown> } | null)?.validationErrors?.entitlement

  return held && typeof held === 'object' ? (held as ConsoleEntitlement) : null
}
