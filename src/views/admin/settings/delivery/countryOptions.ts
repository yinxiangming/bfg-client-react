/**
 * The country list the delivery dialogs offer, and its localised labels.
 *
 * Shared by the warehouse and pickup-point dialogs — the two describe the same
 * kind of place, so a country that can hold one can hold the other.
 */

// ISO 3166-1 alpha-2
export const COUNTRY_CODES = [
  'US', 'CA', 'GB', 'AU', 'NZ', 'CN', 'JP', 'KR', 'SG', 'MY',
  'TH', 'PH', 'ID', 'VN', 'IN', 'DE', 'FR', 'IT', 'ES', 'NL',
  'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'BR', 'MX',
  'AR', 'CL', 'ZA', 'AE', 'SA', 'IL', 'TR', 'RU'
] as const

export type CountryOption = { value: string; label: string }

/** Country codes with names in `locale`, sorted by name. Falls back to codes. */
export const buildCountryOptions = (locale: string): CountryOption[] => {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' })
    return [...COUNTRY_CODES]
      .map(code => ({ value: code, label: displayNames.of(code) || code }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch {
    return [...COUNTRY_CODES].map(code => ({ value: code, label: code }))
  }
}
