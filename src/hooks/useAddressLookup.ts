'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  createAddressLookupSession,
  getAddressLookupStatus,
  isAddressLookupUsageCapError,
  isAddressLookupUsageCapped,
  resolveAddress,
  suggestAddresses,
  type AddressSuggestion,
  type ResolvedAddress
} from '@/services/geo'

/** Characters typed before the first request goes out. */
const MIN_QUERY_LENGTH = 3

/** Quiet time after the last keystroke. */
const DEBOUNCE_MS = 300

/**
 * Whether this deployment offers address lookup at all, asked once per page.
 *
 * The answer is a property of the workspace, not of the field, and a checkout has
 * three address fields in it; asking per field would put the same question three
 * times. `null` means the question could not be answered — an older server with no
 * such route, or a visitor the endpoint will not talk to — and is deliberately not
 * the same as `false`: the typeahead still tries once and learns from the refusal,
 * rather than switching itself off over a request that may simply have failed.
 */
let availability: Promise<boolean | null> | null = null

function addressLookupAvailable(): Promise<boolean | null> {
  availability ??= getAddressLookupStatus().then(
    status => status.enabled,
    () => null
  )

  return availability
}

/** Forget the cached answer — after a workspace switch, or between tests. */
export function resetAddressLookupAvailability(): void {
  availability = null
}

/**
 * Not "the lookup failed" but "there is no lookup here": the feature is off for the
 * workspace (404), or this visitor may not use it (401/403). Retrying on the next
 * keystroke cannot change any of those, so the field stops asking.
 *
 * A provider outage (502/503) is not in the list on purpose. That one passes, and
 * the next keystroke tries again.
 */
function isUnavailable(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status

  return status === 401 || status === 403 || status === 404
}

/**
 * The address-form fields a resolved address answers for, beside the street line
 * the lookup field holds itself.
 *
 * Empty fields are left out rather than written as blanks: an address that came
 * back without a postcode says nothing about the postcode, and clearing what
 * someone had already typed there would be a worse answer than leaving it alone.
 * Every address form in the app names these fields the same way, so the mapping
 * is decided once here rather than in each form.
 */
export function resolvedAddressFields(resolved: ResolvedAddress): Record<string, string> {
  const fields: Record<string, string> = {}

  // `district` is the suburb. The server only fills `address_line2` when the
  // address has a second line of its own, and a suburb is what forms here have
  // always put there.
  const line2 = resolved.address_line2 || resolved.district

  if (line2) fields.address_line2 = line2
  if (resolved.city) fields.city = resolved.city
  if (resolved.state) fields.state = resolved.state
  if (resolved.postal_code) fields.postal_code = resolved.postal_code
  if (resolved.country) fields.country = resolved.country

  return fields
}

export type AddressLookup = {
  /** Suggestions for what has been typed so far. Empty whenever there is nothing to offer. */
  suggestions: AddressSuggestion[]
  /**
   * The workspace has spent the address lookups it pays for this month.
   *
   * Nothing is broken and nothing is blocked: the field is an ordinary text input
   * for the rest of the session, and the only thing left to do is say so under it.
   */
  capped: boolean
  /** Ask for suggestions for `query`. Debounced, and the last word wins. */
  search: (query: string) => void
  /** Drop the suggestions on screen and any request behind them. */
  clear: () => void
  /**
   * Expand a suggestion into address fields, and spend the session that found it.
   *
   * Resolves to `null` when the answer cannot be had — the cap, or a provider that
   * failed — in which case the caller keeps whatever was typed, which is still a
   * usable address.
   */
  select: (suggestion: AddressSuggestion) => Promise<ResolvedAddress | null>
}

/**
 * The typeahead behind an address field, without the field.
 *
 * Every address field in the app needs the same things — debounce what is typed,
 * ignore answers to questions that have been superseded, carry one session token
 * from the first keystroke to the selection, and fall back to plain typing when the
 * server has nothing to offer — and none of them is about how the field looks. So
 * the rules live here once, and each field renders its own suggestions.
 */
export function useAddressLookup(): AddressLookup {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [capped, setCapped] = useState(isAddressLookupUsageCapped)

  const sessionRef = useRef<ReturnType<typeof createAddressLookupSession> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const offRef = useRef(false)

  const session = (sessionRef.current ??= createAddressLookupSession())

  /** Stop the request in flight and whatever the last keystroke had queued up. */
  const abortPending = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = null
    requestRef.current?.abort()
    requestRef.current = null
  }, [])

  // A field that has gone away must not be filled in, and a request nobody is
  // waiting for need not finish.
  useEffect(() => abortPending, [abortPending])

  const clear = useCallback(() => {
    abortPending()
    setSuggestions([])
  }, [abortPending])

  const search = useCallback(
    (query: string) => {
      abortPending()

      const input = query.trim()

      if (offRef.current || input.length < MIN_QUERY_LENGTH) {
        setSuggestions([])

        return
      }

      debounceRef.current = setTimeout(async () => {
        const request = new AbortController()

        requestRef.current = request

        try {
          const available = await addressLookupAvailable()

          if (request.signal.aborted) return

          if (available === false) {
            offRef.current = true

            return
          }

          const results = await suggestAddresses(input, session.current(), request.signal)

          // A newer keystroke, or the field unmounted, while this was in flight.
          // Filling the list now would answer a question nobody is asking any more.
          if (request.signal.aborted) return

          setSuggestions(results)

          // `suggestAddresses` swallows the refusal to keep it out of the typeahead,
          // so the latch it leaves behind is the only thing that says it happened.
          if (isAddressLookupUsageCapped()) setCapped(true)
        } catch (error) {
          if (request.signal.aborted) return
          if (isUnavailable(error)) offRef.current = true
          setSuggestions([])
        }
      }, DEBOUNCE_MS)
    },
    [abortPending, session]
  )

  const select = useCallback(
    async (suggestion: AddressSuggestion) => {
      // The typing is over: anything still queued would arrive after the answer.
      abortPending()
      setSuggestions([])

      const request = new AbortController()

      requestRef.current = request

      try {
        const resolved = await resolveAddress(suggestion.place_id, session.current(), request.signal)

        if (request.signal.aborted) return null

        // The selection is what the session was for, and what it was billed as.
        // Only a session that ended this way is spent; one that failed keeps its
        // token, so retrying the same address does not pay for the typing twice.
        session.renew()

        return resolved
      } catch (error) {
        if (isAddressLookupUsageCapError(error)) setCapped(true)
        else if (isUnavailable(error)) offRef.current = true

        return null
      }
    },
    [abortPending, session]
  )

  return { suggestions, capped, search, clear, select }
}
