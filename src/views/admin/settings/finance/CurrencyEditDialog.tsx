'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Currency, CurrencyPayload } from '@/services/finance'

type CurrencyEditDialogProps = {
  open: boolean
  currency: Currency | null
  onClose: () => void
  onSave: (data: CurrencyPayload) => Promise<void> | void
}

const buildCurrencyFormSchema = (t: any): FormSchema => ({
  title: t('settings.finance.currencies.editDialog.title'),
  fields: [
    { field: 'code', label: t('settings.finance.currencies.editDialog.fields.code'), type: 'string', required: true },
    { field: 'name', label: t('settings.finance.currencies.editDialog.fields.name'), type: 'string', required: true },
    { field: 'symbol', label: t('settings.finance.currencies.editDialog.fields.symbol'), type: 'string', required: true },
    {
      field: 'decimal_places',
      label: t('settings.finance.currencies.editDialog.fields.decimalPlaces'),
      type: 'number',
      required: true,
      defaultValue: 2
    },
    { field: 'is_active', label: t('settings.finance.currencies.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const CurrencyEditDialog = ({ open, currency, onClose, onSave }: CurrencyEditDialogProps) => {
  const t = useTranslations('admin')
  const currencyFormSchema = useMemo(() => buildCurrencyFormSchema(t), [t])

  const initialData: Partial<Currency> = currency
    ? currency
    : {
        code: '',
        name: '',
        symbol: '',
        decimal_places: 2,
        is_active: true
      }

  const handleSubmit = async (data: Partial<Currency>) => {
    const payload: CurrencyPayload = {
      code: data.code || '',
      name: data.name || '',
      symbol: data.symbol || '',
      decimal_places: Number(data.decimal_places ?? 2),
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
        <SchemaForm schema={currencyFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default CurrencyEditDialog

