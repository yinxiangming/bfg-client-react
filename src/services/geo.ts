/**
 * Address lookup, served by the server's `apps.geo` at `/api/v1/geo/`.
 *
 * The web storefront talks to Google directly through the browser SDK
 * (`components/storefront/AddressAutocomplete.tsx`); these endpoints exist for
 * clients that cannot load it — the WeChat mini-program above all. The admin uses
 * `getAddressLookupStatus` to show an operator what the server actually resolved,
 * which is the only way to tell a workspace that is switched on from one that is
 * switched on but has no `GOOGLE_MAPS_API_KEY` behind it.
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

export async function getAddressLookupStatus(): Promise<AddressLookupStatus> {
  return apiFetch<AddressLookupStatus>(geoUrl('address/config/'))
}

export async function suggestAddresses(query: string, sessionToken?: string): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({ q: query })
  if (sessionToken) params.set('session', sessionToken)
  const res = await apiFetch<{ results: AddressSuggestion[] }>(`${geoUrl('address/suggest/')}?${params}`)
  return res?.results ?? []
}

export async function resolveAddress(placeId: string, sessionToken?: string): Promise<ResolvedAddress> {
  const params = new URLSearchParams({ place_id: placeId })
  if (sessionToken) params.set('session', sessionToken)
  return apiFetch<ResolvedAddress>(`${geoUrl('address/resolve/')}?${params}`)
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<ResolvedAddress> {
  const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude) })
  return apiFetch<ResolvedAddress>(`${geoUrl('address/reverse/')}?${params}`)
}
