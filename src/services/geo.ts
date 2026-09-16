/**
 * Address lookup, served by the server at `/api/v1/geo/`.
 *
 * Every client comes through here, browsers included: the provider is called from
 * the server, so its key never ships to a page and the workspace that spent the
 * lookup is the one billed for it. The admin uses `getAddressLookupStatus` to show
 * an operator what the server actually resolved, which is the only way to tell a
 * workspace that is switched on from one that is switched on but has no
 * `GOOGLE_MAPS_API_KEY` behind it.
 *
 * Suggest, resolve and reverse are billed to the workspace, and the server refuses
 * them with 402 `usage_cap_reached` once the month's budget is gone. That refusal is
 * a limit, not a fault: see {@link isAddressLookupUsageCapped} for how a caller is
 * meant to answer it.
 */

import { apiFetch, buildApiUrl, API_VERSIONS } from '@/utils/api'

const geoUrl = (path: string) => buildApiUrl(`/geo/${path}`, API_VERSIONS.BFG2)

export type AddressLookupStatus = {
  /** True only when the workspace switched it on *and* the server has a key. */
  enabled: boolean
  /** The country actually in force, after the workspace-market fallback. */
  country_code: string
  language: string
  provider: string
}

export type AddressSuggestion = {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
}

export type ResolvedAddress = {
  place_id: string
  display_name: string
  formatted_address: string
  address_line1: string
  address_line2: string
  district: string
  city: string
  state: string
  postal_code: string
  country: string
  latitude: number | null
  longitude: number | null
}

/**
 * The server's stable code for "this workspace has spent its address lookups for
 * the month". The wording that travels with it is not stable, so nothing keys off it.
 */
export const ADDRESS_LOOKUP_USAGE_CAP_CODE = 'usage_cap_reached'

/**
 * True only for that refusal: HTTP 402 carrying that code.
 *
 * Deliberately narrow. Every other failure — the feature switched off for the
 * workspace (404), a provider outage (502/503), an expired token (401) — keeps the
 * handling it already had, because none of them is fixed by the person typing the
 * address in by hand.
 */
export function isAddressLookupUsageCapError(error: unknown): boolean {
  if ((error as { status?: number } | null)?.status !== 402) return false

  const body = (error as { validationErrors?: Record<string, unknown> } | null)?.validationErrors

  return body?.code === ADDRESS_LOOKUP_USAGE_CAP_CODE
}

/**
 * Remembered for the rest of the page's life once the server has refused once.
 *
 * A cap does not lift while someone is still typing, so re-asking on every keystroke
 * only spends requests to be told the same thing. Module state rather than a store:
 * this is a fact about the workspace's month, not about any one component.
 */
let usageCapped = false

/** Whether the server has already refused this session for want of budget. */
export function isAddressLookupUsageCapped(): boolean {
  return usageCapped
}

/** Forget the refusal — after a workspace switch, or between tests. */
export function resetAddressLookupUsageCap(): void {
  usageCapped = false
}

/** The refusal as the server would have sent it, for the calls we no longer send. */
function usageCapError(): Error {
  const error = new Error('address lookup usage cap reached') as Error & {
    status: number
    validationErrors: { detail: string; code: string }
  }

  error.status = 402
  error.validationErrors = { detail: error.message, code: ADDRESS_LOOKUP_USAGE_CAP_CODE }

  return error
}

/** Run a billed call, latching the cap so the next one never leaves the browser. */
async function billedCall<T>(run: () => Promise<T>): Promise<T> {
  if (usageCapped) throw usageCapError()

  try {
    return await run()
  } catch (error) {
    if (isAddressLookupUsageCapError(error)) usageCapped = true
    throw error
  }
}

/**
 * One run of the typeahead, from the first keystroke to the address that was picked.
 *
 * The provider prices a run, not a request: every suggestion asked for under the
 * same token is charged once, when the resolve at the end of it says which address
 * the run was for. A token per run therefore costs one lookup; a token per keystroke
 * costs one per character typed, and no token at all costs the same again. So the
 * token has to outlive each keystroke and be spent by the selection — which is what
 * {@link renew} marks, leaving the next run to start clean.
 *
 * It lives here rather than in each field so that "one run, one token" is decided
 * once, in the only place that knows what the calls cost.
 */
export type AddressLookupSession = {
  /** The token every call of the run in progress carries. */
  current(): string
  /** End the run, once a selection has been resolved: the next call starts a new one. */
  renew(): void
}

function newSessionToken(): string {
  // The server truncates at 64 characters and the provider wants an opaque string;
  // a UUID is both. `randomUUID` needs a secure context, which a form on http://
  // in development is not, so it cannot simply be assumed.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/** A fresh {@link AddressLookupSession}, ready for the first keystroke. */
export function createAddressLookupSession(): AddressLookupSession {
  let token = newSessionToken()

  return {
    current: () => token,
    renew: () => {
      token = newSessionToken()
    }
  }
}

export async function getAddressLookupStatus(): Promise<AddressLookupStatus> {
  // Not billed, so it still answers once the cap is reached, and a client that asks
  // it first still learns whether to offer the feature at all.
  return apiFetch<AddressLookupStatus>(geoUrl('address/config/'))
}

/**
 * Addresses matching `query`, or none at all once the cap is reached.
 *
 * The typeahead is the one call nobody asked for by name, so being capped is not
 * something to throw at them mid-keystroke: it degrades to the empty list an
 * unmatched query already returns, and the field stays an ordinary text input they
 * can finish filling in themselves. Ask {@link isAddressLookupUsageCapped} afterwards
 * to tell that silence apart from "nothing matched" — that is the one that earns a
 * line of help under the field.
 */
export async function suggestAddresses(
  query: string,
  sessionToken?: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  // Nothing is sent once the latch is set: the answer cannot change this month, and
  // a typeahead would otherwise ask again on every keystroke to be told so.
  if (usageCapped) return []

  const params = new URLSearchParams({ q: query })
  if (sessionToken) params.set('session', sessionToken)

  try {
    const res = await billedCall(() =>
      apiFetch<{ results: AddressSuggestion[] }>(`${geoUrl('address/suggest/')}?${params}`, { signal })
    )

    return res?.results ?? []
  } catch (error) {
    // The refusal that set the latch still arrives here once, and is swallowed too.
    if (isAddressLookupUsageCapError(error)) return []
    throw error
  }
}

/**
 * Expand a suggestion into the fields of an address form.
 *
 * Unlike the typeahead this follows something that was actually clicked, and an
 * empty answer would mean nothing to the person waiting for it, so the cap surfaces
 * as {@link isAddressLookupUsageCapError}. Callers show the help line and leave the
 * fields editable rather than blocking the form.
 */
export async function resolveAddress(
  placeId: string,
  sessionToken?: string,
  signal?: AbortSignal
): Promise<ResolvedAddress> {
  const params = new URLSearchParams({ place_id: placeId })
  if (sessionToken) params.set('session', sessionToken)

  return billedCall(() => apiFetch<ResolvedAddress>(`${geoUrl('address/resolve/')}?${params}`, { signal }))
}

/** A dropped pin turned into address fields; capped the same way as {@link resolveAddress}. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<ResolvedAddress> {
  const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude) })

  return billedCall(() => apiFetch<ResolvedAddress>(`${geoUrl('address/reverse/')}?${params}`))
}
