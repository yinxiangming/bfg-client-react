'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { DeliveryZone, DeliveryZonePayload } from '@/services/delivery'

type DeliveryZoneFormData = Omit<DeliveryZonePayload, 'countries' | 'postal_code_patterns'> & {
  countries?: string
  postal_code_patterns?: string
}

type DeliveryZoneEditDialogProps = {
  open: boolean
  zone: DeliveryZone | null
  onClose: () => void
  onSave: (data: DeliveryZonePayload) => Promise<void> | void
}

const buildDeliveryZoneFormSchema = (t: any): FormSchema => ({
  title: t('settings.delivery.zones.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.delivery.zones.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.delivery.zones.editDialog.fields.code'), type: 'string', required: true },
    {
      field: 'countries',
      label: t('settings.delivery.zones.editDialog.fields.countries'),
      type: 'string',
      placeholder: t('settings.delivery.zones.editDialog.placeholders.countries'),
      required: true
    },
    {
      field: 'postal_code_patterns',
      label: t('settings.delivery.zones.editDialog.fields.postalCodePatterns'),
      type: 'string',
      placeholder: t('settings.delivery.zones.editDialog.placeholders.postalCodePatterns'),
      required: false
    },
    { field: 'is_active', label: t('settings.delivery.zones.editDialog.fields.active'), type: 'boolean', defaultValue: true, newline: true }
  ]
})

const DeliveryZoneEditDialog = ({ open, zone, onClose, onSave }: DeliveryZoneEditDialogProps) => {
  const t = useTranslations('admin')
  const deliveryZoneFormSchema = useMemo(() => buildDeliveryZoneFormSchema(t), [t])

  const initialData: Partial<DeliveryZoneFormData> = zone
    ? {
        name: zone.name,
        code: zone.code,
        countries: Array.isArray(zone.countries) ? zone.countries.join(', ') : '',
        postal_code_patterns: Array.isArray(zone.postal_code_patterns) ? zone.postal_code_patterns.join(', ') : '',
        is_active: zone.is_active
      }
    : {
        name: '',
        code: '',
        countries: '',
        postal_code_patterns: '',
        is_active: true
      }

  const handleSubmit = async (data: Partial<DeliveryZoneFormData>) => {
    const payload: DeliveryZonePayload = {
      name: data.name || '',
      code: data.code || '',
      countries: typeof data.countries === 'string'
        ? data.countries.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(data.countries) ? data.countries : []),
      postal_code_patterns: typeof data.postal_code_patterns === 'string'
        ? data.postal_code_patterns.split(',').map(s => s.trim()).filter(Boolean)
        : (Array.isArray(data.postal_code_patterns) ? data.postal_code_patterns : []),
      is_active: Boolean(data.is_active)
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm
          schema={deliveryZoneFormSchema}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

export default DeliveryZoneEditDialog

