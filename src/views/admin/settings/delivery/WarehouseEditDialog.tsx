'use client'

import { useCallback, useMemo, useState } from 'react'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Box from '@mui/material/Box'

// Component Imports
import AddressLookupField from '@/components/ui/AddressLookupField'
import SchemaForm from '@/components/schema/SchemaForm'
import { resolvedAddressFields } from '@/hooks/useAddressLookup'
import type { ResolvedAddress } from '@/services/geo'
import type { FormSchema } from '@/types/schema'
import type { Warehouse, WarehousePayload } from '@/services/delivery'
import { buildCountryOptions } from './countryOptions'

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
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number | null; lng: number | null }>({
    lat: warehouse?.latitude ? parseFloat(String(warehouse.latitude)) : null,
    lng: warehouse?.longitude ? parseFloat(String(warehouse.longitude)) : null
  })

  const countryOptions = useMemo(() => buildCountryOptions(locale), [locale])

  const warehouseFormSchema = useMemo(() => buildWarehouseFormSchema(t, countryOptions), [t, countryOptions])

  // Rebuilt only when the warehouse is: SchemaForm treats a new `initialData` as a
  // new form and resets every field to it, so an object rebuilt on each render
  // would throw away what someone had typed the moment anything here changed state.
  const initialData: Partial<WarehousePayload> = useMemo(() => (warehouse
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
      }), [warehouse])

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

  // The address line looks the rest of the address up. What it finds belongs in two
  // places: the fields beside it, which are the form's, and the coordinates, which
  // are this dialog's — a warehouse is put on the map by the address chosen for it.
  const customFieldRenderer = useCallback(
    (
      field: any,
      value: any,
      onChange: (value: any) => void,
      error: string | undefined,
      setValues: (values: Record<string, any>) => void
    ) => {
      if (field.field !== 'address_line1') return null

      const handleResolved = (resolved: ResolvedAddress) => {
        setValues(resolvedAddressFields(resolved))
        setAddressCoordinates({ lat: resolved.latitude, lng: resolved.longitude })
      }

      return (
        <AddressLookupField
          name='address_line1'
          label={field.label}
          value={value || ''}
          onChange={onChange}
          onResolved={handleResolved}
          error={!!error}
          helperText={error}
          required={field.required}
          placeholder={t('settings.delivery.warehouses.editDialog.addressSearchPlaceholder')}
        />
      )
    },
    [t]
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogContent sx={{ p: 0 }}>
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

