'use client'

import { useMemo } from 'react'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { PickupPoint, PickupPointPayload, Warehouse } from '@/services/delivery'
import { buildCountryOptions, type CountryOption } from './countryOptions'

type PickupPointEditDialogProps = {
  open: boolean
  point: PickupPoint | null
  warehouses: Warehouse[]
  onClose: () => void
  onSave: (data: PickupPointPayload) => Promise<void> | void
}

const buildSchema = (
  t: any,
  countryOptions: CountryOption[],
  warehouseOptions: Array<{ value: string | number; label: string }>
): FormSchema => ({
  title: t('settings.delivery.pickupPoints.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.delivery.pickupPoints.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.delivery.pickupPoints.editDialog.fields.code'), type: 'string', required: true },
    { field: 'is_active', label: t('settings.delivery.pickupPoints.editDialog.fields.active'), type: 'boolean', defaultValue: true, newline: true },
    {
      field: 'is_default',
      label: t('settings.delivery.pickupPoints.editDialog.fields.defaultPoint'),
      type: 'boolean',
      defaultValue: false,
      helperText: t('settings.delivery.pickupPoints.editDialog.fields.defaultPointHelp'),
      newline: true
    },

    // Where it is
    { field: 'address_line1', label: t('settings.delivery.pickupPoints.editDialog.fields.addressLine1'), type: 'string', required: true, newline: true },
    { field: 'address_line2', label: t('settings.delivery.pickupPoints.editDialog.fields.addressLine2'), type: 'string' },
    { field: 'city', label: t('settings.delivery.pickupPoints.editDialog.fields.city'), type: 'string', required: true },
    { field: 'state', label: t('settings.delivery.pickupPoints.editDialog.fields.state'), type: 'string' },
    { field: 'postal_code', label: t('settings.delivery.pickupPoints.editDialog.fields.postalCode'), type: 'string' },
    {
      field: 'country',
      label: t('settings.delivery.pickupPoints.editDialog.fields.country'),
      type: 'select',
      options: countryOptions,
      newline: true
    },
    { field: 'latitude', label: t('settings.delivery.pickupPoints.editDialog.fields.latitude'), type: 'number' },
    { field: 'longitude', label: t('settings.delivery.pickupPoints.editDialog.fields.longitude'), type: 'number' },

    // How to reach it
    { field: 'phone', label: t('settings.delivery.pickupPoints.editDialog.fields.phone'), type: 'string', newline: true },
    { field: 'email', label: t('settings.delivery.pickupPoints.editDialog.fields.email'), type: 'string' },
    {
      field: 'instructions',
      label: t('settings.delivery.pickupPoints.editDialog.fields.instructions'),
      type: 'textarea',
      helperText: t('settings.delivery.pickupPoints.editDialog.fields.instructionsHelp'),
      newline: true
    },

    // What it costs, and where its stock comes from
    {
      field: 'fee',
      label: t('settings.delivery.pickupPoints.editDialog.fields.fee'),
      type: 'number',
      helperText: t('settings.delivery.pickupPoints.editDialog.fields.feeHelp'),
      newline: true
    },
    { field: 'sort_order', label: t('settings.delivery.pickupPoints.editDialog.fields.sortOrder'), type: 'number' },
    {
      field: 'warehouse',
      label: t('settings.delivery.pickupPoints.editDialog.fields.warehouse'),
      type: 'select',
      options: warehouseOptions,
      optionsAllowEmpty: true,
      helperText: t('settings.delivery.pickupPoints.editDialog.fields.warehouseHelp'),
      newline: true
    }
  ]
})

/** '' and undefined both mean "not set" for a nullable decimal column. */
const numberOrNull = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const PickupPointEditDialog = ({ open, point, warehouses, onClose, onSave }: PickupPointEditDialogProps) => {
  const t = useTranslations('admin')
  const locale = useLocale()

  const countryOptions = useMemo(() => buildCountryOptions(locale), [locale])
  const warehouseOptions = useMemo(
    () => warehouses.map(w => ({ value: w.id, label: w.name })),
    [warehouses]
  )
  const schema = useMemo(
    () => buildSchema(t, countryOptions, warehouseOptions),
    [t, countryOptions, warehouseOptions]
  )

  const initialData: Partial<PickupPointPayload> = point
    ? {
        name: point.name || '',
        code: point.code || '',
        warehouse: point.warehouse ?? null,
        address_line1: point.address_line1 || '',
        address_line2: point.address_line2 || '',
        city: point.city || '',
        state: point.state || '',
        postal_code: point.postal_code || '',
        country: point.country || '',
        latitude: point.latitude ?? null,
        longitude: point.longitude ?? null,
        phone: point.phone || '',
        email: point.email || '',
        instructions: point.instructions || '',
        fee: point.fee ?? 0,
        sort_order: point.sort_order ?? 100,
        is_active: point.is_active ?? true,
        is_default: point.is_default ?? false
      }
    : {
        name: '',
        code: '',
        warehouse: null,
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        latitude: null,
        longitude: null,
        phone: '',
        email: '',
        instructions: '',
        fee: 0,
        sort_order: 100,
        is_active: true,
        is_default: false
      }

  const handleSubmit = async (data: Partial<PickupPointPayload>) => {
    await onSave({
      name: data.name || '',
      code: data.code || '',
      warehouse: data.warehouse ? Number(data.warehouse) : null,
      address_line1: data.address_line1 || '',
      address_line2: data.address_line2 || '',
      city: data.city || '',
      state: data.state || '',
      postal_code: data.postal_code || '',
      country: data.country || '',
      latitude: numberOrNull(data.latitude),
      longitude: numberOrNull(data.longitude),
      phone: data.phone || '',
      email: data.email || '',
      instructions: data.instructions || '',
      fee: numberOrNull(data.fee) ?? 0,
      sort_order: numberOrNull(data.sort_order) ?? 100,
      is_active: Boolean(data.is_active),
      is_default: Boolean(data.is_default)
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <SchemaForm schema={schema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default PickupPointEditDialog
