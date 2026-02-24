'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { TaxRate, TaxRatePayload } from '@/services/finance'

type TaxRateEditDialogProps = {
  open: boolean
  taxRate: TaxRate | null
  onClose: () => void
  onSave: (data: TaxRatePayload) => Promise<void> | void
}

const buildTaxRateFormSchema = (t: any): FormSchema => ({
  title: t('settings.finance.taxRates.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.finance.taxRates.editDialog.fields.name'), type: 'string', required: true },
    { field: 'rate', label: t('settings.finance.taxRates.editDialog.fields.ratePercent'), type: 'number', required: true },
    { field: 'country', label: t('settings.finance.taxRates.editDialog.fields.country'), type: 'string', required: true },
    { field: 'state', label: t('settings.finance.taxRates.editDialog.fields.stateProvince'), type: 'string' },
    { field: 'is_active', label: t('settings.finance.taxRates.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const TaxRateEditDialog = ({ open, taxRate, onClose, onSave }: TaxRateEditDialogProps) => {
  const t = useTranslations('admin')
  const taxRateFormSchema = useMemo(() => buildTaxRateFormSchema(t), [t])

  const initialData: Partial<TaxRate> = taxRate
    ? taxRate
    : {
        name: '',
        rate: 0,
        country: '',
        state: '',
        is_active: true
      }

  const handleSubmit = async (data: Partial<TaxRate>) => {
    const payload: TaxRatePayload = {
      name: data.name || '',
      rate: Number(data.rate ?? 0),
      country: data.country || '',
      state: data.state || '',
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
        <SchemaForm schema={taxRateFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default TaxRateEditDialog

