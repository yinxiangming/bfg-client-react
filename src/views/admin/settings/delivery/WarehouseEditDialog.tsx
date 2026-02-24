'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Warehouse, WarehousePayload } from '@/services/delivery'

// Google Places API types
declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
  }
}

// Common country codes (ISO 3166-1 alpha-2)
const COUNTRY_CODES = [
  'US',
  'CA',
  'GB',
  'AU',
  'NZ',
  'CN',
  'JP',
  'KR',
  'SG',
  'MY',
  'TH',
  'PH',
  'ID',
  'VN',
  'IN',
  'DE',
  'FR',
  'IT',
  'ES',
  'NL',
  'BE',
  'CH',
  'AT',
  'SE',
  'NO',
  'DK',
  'FI',
  'PL',
  'BR',
  'MX',
  'AR',
  'CL',
  'ZA',
  'AE',
  'SA',
  'IL',
  'TR',
  'RU'
] as const

type WarehouseEditDialogProps = {
  open: boolean
  warehouse: Warehouse | null
  onClose: () => void
  onSave: (data: WarehousePayload) => Promise<void> | void
}

const buildWarehouseFormSchema = (
  t: any,
  countryOptions: Array<{ value: string; label: string }>
): FormSchema => ({
  title: t('settings.delivery.warehouses.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.delivery.warehouses.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.delivery.warehouses.editDialog.fields.code'), type: 'string', required: true },
    { field: 'is_active', label: t('settings.delivery.warehouses.editDialog.fields.active'), type: 'boolean', defaultValue: true, newline: true },
    {
      field: 'is_default',
      label: t('settings.delivery.warehouses.editDialog.fields.defaultWarehouse'),
      type: 'boolean',
      defaultValue: false,
      newline: true
    },
    // Address section with autocomplete
    {
      field: 'address_line1',
      label: t('settings.delivery.warehouses.editDialog.fields.addressLine1'),
      type: 'string',
      required: true,
      newline: true
    },
    { field: 'address_line2', label: t('settings.delivery.warehouses.editDialog.fields.addressLine2'), type: 'string' },
    { field: 'city', label: t('settings.delivery.warehouses.editDialog.fields.city'), type: 'string', required: true },
    { field: 'state', label: t('settings.delivery.warehouses.editDialog.fields.state'), type: 'string' },
    { field: 'postal_code', label: t('settings.delivery.warehouses.editDialog.fields.postalCode'), type: 'string', required: true },
    {
      field: 'country',
      label: t('settings.delivery.warehouses.editDialog.fields.country'),
      type: 'select',
      options: countryOptions,
      required: true,
      newline: true
    },
    // Contact section
    { field: 'phone', label: t('settings.delivery.warehouses.editDialog.fields.phone'), type: 'string', newline: true },
    { field: 'email', label: t('settings.delivery.warehouses.editDialog.fields.email'), type: 'string' }
  ]
})

const WarehouseEditDialog = ({ open, warehouse, onClose, onSave }: WarehouseEditDialogProps) => {
  const t = useTranslations('admin')
  const locale = useLocale()
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number | null; lng: number | null }>({
    lat: warehouse?.latitude ? parseFloat(String(warehouse.latitude)) : null,
    lng: warehouse?.longitude ? parseFloat(String(warehouse.longitude)) : null
  })

  // Load Google Maps script
  useEffect(() => {
    if (!open) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured')
      return
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsGoogleMapsLoaded(true)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsGoogleMapsLoaded(true))
      return
    }

    // Create callback for async loading
    window.initGoogleMaps = () => {
      setIsGoogleMapsLoaded(true)
    }

    // Load the script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [open])

  // Initialize autocomplete
  useEffect(() => {
    if (!isGoogleMapsLoaded || !addressInputRef.current || autocompleteRef.current || !open) return

    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'geometry']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (!place.address_components || !place.geometry) return

      // Extract coordinates
      const location = place.geometry.location
      if (location) {
        setAddressCoordinates({
          lat: location.lat(),
          lng: location.lng()
        })
      }

      // Parse address components and update form fields
      let streetNumber = ''
      let route = ''
      let city = ''
      let state = ''
      let postalCode = ''
      let country = ''

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
            if (!city) {
              city = component.long_name
            }
            break
          case 'administrative_area_level_1':
            state = component.short_name
            break
          case 'postal_code':
            postalCode = component.long_name
            break
          case 'country':
            country = component.short_name // ISO 3166-1 alpha-2 code
            break
        }
      }

      // Update form fields via DOM (since we're using SchemaForm)
      const addressLine1Input = document.querySelector('input[name="address_line1"]') as HTMLInputElement
      const cityInput = document.querySelector('input[name="city"]') as HTMLInputElement
      const stateInput = document.querySelector('input[name="state"]') as HTMLInputElement
      const postalCodeInput = document.querySelector('input[name="postal_code"]') as HTMLInputElement
      const countrySelect = document.querySelector('select[name="country"]') as HTMLSelectElement

      if (addressLine1Input) {
        addressLine1Input.value = [streetNumber, route].filter(Boolean).join(' ')
        addressLine1Input.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (cityInput) {
        cityInput.value = city
        cityInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (stateInput) {
        stateInput.value = state
        stateInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (postalCodeInput) {
        postalCodeInput.value = postalCode
        postalCodeInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      if (countrySelect && country) {
        countrySelect.value = country
        countrySelect.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    autocompleteRef.current = autocomplete
  }, [isGoogleMapsLoaded, open])

  const countryOptions = useMemo(() => {
    try {
      const displayNames = new Intl.DisplayNames([locale], { type: 'region' })
      return [...COUNTRY_CODES]
        .map(code => ({ value: code, label: displayNames.of(code) || code }))
        .sort((a, b) => a.label.localeCompare(b.label))
    } catch {
      return [...COUNTRY_CODES].map(code => ({ value: code, label: code }))
    }
  }, [locale])

  const warehouseFormSchema = useMemo(() => buildWarehouseFormSchema(t, countryOptions), [t, countryOptions])

  const initialData: Partial<WarehousePayload> = warehouse
    ? {
        name: warehouse.name || '',
        code: warehouse.code || '',
        address_line1: warehouse.address_line1 || '',
        address_line2: warehouse.address_line2 || '',
        city: warehouse.city || '',
        state: warehouse.state || '',
        postal_code: warehouse.postal_code || '',
        country: warehouse.country || '',
        latitude: warehouse.latitude ? parseFloat(String(warehouse.latitude)) : undefined,
        longitude: warehouse.longitude ? parseFloat(String(warehouse.longitude)) : undefined,
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        is_active: warehouse.is_active ?? true,
        is_default: warehouse.is_default ?? false
      }
    : {
        name: '',
        code: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        phone: '',
        email: '',
        is_active: true,
        is_default: false
      }

  const handleSubmit = async (data: Partial<WarehousePayload>) => {
    const payload: WarehousePayload = {
      name: data.name || '',
      code: data.code || '',
      address_line1: data.address_line1 || '',
      address_line2: data.address_line2 || '',
      city: data.city || '',
      state: data.state || '',
      postal_code: data.postal_code || '',
      country: data.country || '',
      latitude: addressCoordinates.lat !== null ? addressCoordinates.lat : (data.latitude ? parseFloat(String(data.latitude)) : undefined),
      longitude: addressCoordinates.lng !== null ? addressCoordinates.lng : (data.longitude ? parseFloat(String(data.longitude)) : undefined),
      phone: data.phone || '',
      email: data.email || '',
      is_active: Boolean(data.is_active),
      is_default: Boolean(data.is_default)
    }
    await onSave(payload)
  }

  // Custom field renderer for address_line1 with autocomplete
  const customFieldRenderer = useCallback((field: any, value: any, onChange: (value: any) => void, error?: string) => {
    if (field.field === 'address_line1') {
      return (
        <TextField
          inputRef={addressInputRef}
          name="address_line1"
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
          required={field.required}
          fullWidth
          placeholder={t('settings.delivery.warehouses.editDialog.addressSearchPlaceholder')}
        />
      )
    }
    return null
  }, [t])

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm 
          schema={warehouseFormSchema} 
          initialData={initialData} 
          onSubmit={handleSubmit} 
          onCancel={onClose}
          customFieldRenderer={customFieldRenderer}
        />
      </DialogContent>
    </Dialog>
  )
}

export default WarehouseEditDialog

