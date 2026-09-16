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

import type { ConsoleChanger, ConsoleExtensionStatus } from './console'

const BASE = '/platform/console/'

/** Everyone who is not a platform administrator is refused with this code. */
export const PLATFORM_ADMIN_REQUIRED = 'platform_admin_required'

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
    body: JSON.stringify({ value, reason })
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

/**
 * Price a meter from a moment on, without touching what it cost before.
 *
 * Prices are only ever added — there is no way to edit or delete one — so that
 * a bill already issued can still be explained by the row it was calculated
 * from. The answer is the whole meter rather than the row written, because a
 * price dated behind one that already exists changes nothing today and the
 * answer says which row is in force. Refused with 400 `invalid_meter_price`.
 */
export async function addMeterPrice(price: ConsoleMeterPriceInput): Promise<ConsoleMeterPrices> {
  return apiFetch<ConsoleMeterPrices>(buildApiUrl(`${BASE}meter-prices/`), {
    method: 'POST',
    body: JSON.stringify(price)
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
    body: JSON.stringify(rate)
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
    body: JSON.stringify({ cap_points: capPoints })
  })
}

// ── Entitlements given rather than sold ──────────────────────────────

/** The key an entitlement to the base plan carries: the plan is not an extension. */
export const BASE_PLAN_KEY = ''

export interface ConsoleEntitlement {
  id: number
  key: string
  status: string
  source: string
  starts_at: string | null
  /** When it runs out; null for one that does not expire. */
  current_period_end: string | null
  reason: string
}

/**
 * What granting did to the extension itself, and null for the base plan or a
 * key the workspace has no record of.
 *
 * Granting does not switch an extension on — that is the workspace's decision —
 * with one exception: one the platform itself paused when an entitlement ran
 * out is resumed, since pausing kept its data precisely so that being entitled
 * again would pick it up. `refusal` is why that could not happen.
 */
export interface ConsoleGrantedExtension {
  key: string
  status: ConsoleExtensionStatus
  resumed: boolean
  refusal: { code: string; detail: string } | null
}

export interface ConsoleGrant {
  workspace: number
  entitlement: ConsoleEntitlement
  extension: ConsoleGrantedExtension | null
}

/** What a grant says: what is being given, for how long, and why. */
export interface ConsoleGrantInput {
  /** An extension's key, or `BASE_PLAN_KEY` for the base plan. */
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
 * Refused with 400 `invalid_grant` — which covers a body naming no period, both
 * periods, an impossible one, or no reason — 400 `unknown_extension`, or 409
 * `already_entitled` for a workspace that already holds one, carrying the
 * entitlement it holds.
 */
export async function grantEntitlement(workspaceId: number, grant: ConsoleGrantInput): Promise<ConsoleGrant> {
  return apiFetch<ConsoleGrant>(buildApiUrl(`${BASE}workspaces/${workspaceId}/grants/`), {
    method: 'POST',
    body: JSON.stringify(grant)
  })
}

/** The entitlement an `already_entitled` refusal says the workspace already holds. */
export function getHeldEntitlement(error: unknown): ConsoleEntitlement | null {
  const held = (error as { validationErrors?: Record<string, unknown> } | null)?.validationErrors?.entitlement

  return held && typeof held === 'object' ? (held as ConsoleEntitlement) : null
}
