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

// Google Places API types
declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

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
  const autocompleteRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured')
      return
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true))
      return
    }

    // Create callback for async loading
    window.initGoogleMaps = () => {
      setIsLoaded(true)
    }

    // Load the script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      // Cleanup not needed as we want to keep the script loaded
    }
  }, [])

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (!place.address_components) return

      // Parse address components
      const components: AddressComponents = {
        address: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      }

      let streetNumber = ''
      let route = ''

      for (const component of place.address_components) {
        const type = component.types[0]
        
        switch (type) {
          case 'street_number':
            streetNumber = component.long_name
            break
          case 'route':
            route = component.long_name
            break
          case 'locality':
          case 'sublocality_level_1':
          case 'postal_town':
            if (!components.city) {
              components.city = component.long_name
            }
            break
          case 'administrative_area_level_1':
            components.state = component.short_name
            break
          case 'postal_code':
            components.zip = component.long_name
            break
          case 'country':
            components.country = component.short_name // ISO 3166-1 alpha-2 code
            break
        }
      }

      // Combine street number and route
      components.address = [streetNumber, route].filter(Boolean).join(' ')

      // Update the input with the full address
      onChange(components.address)
      
      // Notify parent with all components
      onAddressSelect(components)
    })

    autocompleteRef.current = autocomplete
  }, [isLoaded, onChange, onAddressSelect])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const defaultStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '1px solid #d0d0d0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.2s'
  }

  return (
    <input
      ref={inputRef}
      type='text'
      value={value}
      onChange={handleChange}
      placeholder={placeholder || t('checkout.delivery.address')}
      required={required}
      style={{ ...defaultStyle, ...style }}
      onFocus={(e) => e.target.style.borderColor = '#6366f1'}
      onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
      autoComplete='off'
    />
  )
}

export default AddressAutocomplete
