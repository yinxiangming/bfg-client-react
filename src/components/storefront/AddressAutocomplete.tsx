'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'

type AddressComponents = {
  address: string
  city: string
  state: string
  zip: string
  country: string
}

type AddressAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (components: AddressComponents) => void
  placeholder?: string
  required?: boolean
  style?: React.CSSProperties
}

type Suggestion = {
  text: string
  placePrediction: any
}

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

let hasWarnedNoApiKey = false
let mapsLoadPromise: Promise<void> | null = null

function loadGoogleMapsAsync(apiKey: string): Promise<void> {
  if (mapsLoadPromise) return mapsLoadPromise
  if (window.google?.maps?.importLibrary) return Promise.resolve()

  const existing = document.querySelector('script[src*="maps.googleapis.com"]')
  if (existing) {
    mapsLoadPromise = new Promise<void>((resolve) => {
      if (window.google?.maps?.importLibrary) return resolve()
      existing.addEventListener('load', () => resolve())
    })
    return mapsLoadPromise
  }

  mapsLoadPromise = new Promise<void>((resolve, reject) => {
    window.initGoogleMaps = () => resolve()
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    script.onerror = () => {
      mapsLoadPromise = null
      reject(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  })

  return mapsLoadPromise
}

function parseAddressComponents(
  components: Array<{ types: string[]; longText?: string; shortText?: string }> | undefined
): AddressComponents {
  const out: AddressComponents = { address: '', city: '', state: '', zip: '', country: '' }
  if (!components?.length) return out

  let streetNumber = ''
  let route = ''

  for (const c of components) {
    const type = c.types?.[0]
    if (!type) continue
    switch (type) {
      case 'street_number':
        streetNumber = c.longText || ''
        break
      case 'route':
        route = c.longText || ''
        break
      case 'locality':
      case 'sublocality_level_1':
      case 'postal_town':
        if (!out.city) out.city = c.longText || ''
        break
      case 'administrative_area_level_1':
        out.state = c.shortText || c.longText || ''
        break
      case 'postal_code':
        out.zip = c.longText || ''
        break
      case 'country':
        out.country = c.shortText || c.longText || ''
        break
    }
  }

  out.address = [streetNumber, route].filter(Boolean).join(' ')
  return out
}

const DEBOUNCE_MS = 300

const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  placeholder,
  required = false,
  style
}: AddressAutocompleteProps) => {
  const t = useTranslations('storefront')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sessionTokenRef = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [ready, setReady] = useState(false)
  const onChangeRef = useRef(onChange)
  const onAddressSelectRef = useRef(onAddressSelect)
  const selectingRef = useRef(false)

  onChangeRef.current = onChange
  onAddressSelectRef.current = onAddressSelect

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      if (!hasWarnedNoApiKey) {
        hasWarnedNoApiKey = true
        console.warn('Google Maps API key not configured (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY). Address autocomplete disabled.')
      }
      return
    }

    let cancelled = false
    loadGoogleMapsAsync(apiKey)
      .then(async () => {
        if (cancelled) return
        await window.google.maps.importLibrary('places')
        if (cancelled) return
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
        setReady(true)
      })
      .catch((err: unknown) => {
        console.error('Failed to load Google Maps Places:', err)
      })

    return () => { cancelled = true }
  }, [])

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!ready || !input || input.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    try {
      const request: any = {
        input,
        sessionToken: sessionTokenRef.current,
        includedPrimaryTypes: ['street_address', 'subpremise', 'premise', 'route'],
      }

      const { suggestions: results } =
        await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)

      const items: Suggestion[] = (results || [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          text: s.placePrediction.text?.text || s.placePrediction.mainText?.text || '',
          placePrediction: s.placePrediction,
        }))

      setSuggestions(items)
      setShowDropdown(items.length > 0)
      setActiveIndex(-1)
    } catch {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [ready])

  const handleSelect = useCallback(async (suggestion: Suggestion) => {
    selectingRef.current = true
    setShowDropdown(false)
    setSuggestions([])

    try {
      const place = suggestion.placePrediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] })

      const parsed = parseAddressComponents(place.addressComponents)
      const street = parsed.address || place.formattedAddress || ''
      onChangeRef.current(street)
      onAddressSelectRef.current(parsed)

      // Renew session token after a selection (billing best practice)
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
    } catch (err) {
      console.error('Failed to fetch place details:', err)
    } finally {
      selectingRef.current = false
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), DEBOUNCE_MS)
  }, [onChange, fetchSuggestions])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }, [showDropdown, suggestions, activeIndex, handleSelect])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (!selectingRef.current) setShowDropdown(false)
    }, 200)
  }, [])

  const defaultStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '1px solid #d0d0d0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'var(--mui-palette-background-paper, #fff)',
    border: '1px solid var(--mui-palette-divider, #d0d0d0)',
    borderRadius: '0 0 8px 8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxHeight: 240,
    overflowY: 'auto',
    marginTop: -1,
  }

  const itemStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    background: active ? 'var(--mui-palette-action-hover, #f5f5f5)' : 'transparent',
    borderBottom: '1px solid var(--mui-palette-divider, #eee)',
    transition: 'background 0.15s',
  })

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type='text'
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
        onBlur={handleBlur}
        placeholder={placeholder || t('checkout.delivery.address')}
        required={required}
        style={{ ...defaultStyle, ...style }}
        autoComplete='off'
      />
      {showDropdown && suggestions.length > 0 && (
        <div style={dropdownStyle}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              style={itemStyle(i === activeIndex)}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(s)
              }}
            >
              {s.text}
            </div>
          ))}
          <div style={{ padding: '4px 14px 6px', fontSize: '0.7rem', opacity: 0.5, textAlign: 'right' }}>
            Powered by Google
          </div>
        </div>
      )}
    </div>
  )
}

export default AddressAutocomplete
