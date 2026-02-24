'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { FinancialCode, FinancialCodePayload } from '@/services/finance'

type FinancialCodeEditDialogProps = {
  open: boolean
  code: FinancialCode | null
  onClose: () => void
  onSave: (data: FinancialCodePayload) => Promise<void> | void
}

const buildFinancialCodeFormSchema = (t: any): FormSchema => ({
  title: t('settings.finance.financialCodes.editDialog.title'),
  fields: [
    { field: 'code', label: t('settings.finance.financialCodes.editDialog.fields.code'), type: 'string', required: true },
    { field: 'name', label: t('settings.finance.financialCodes.editDialog.fields.name'), type: 'string', required: true },
    { field: 'description', label: t('settings.finance.financialCodes.editDialog.fields.description'), type: 'textarea' },
    {
      field: 'tax_type',
      label: t('settings.finance.financialCodes.editDialog.fields.taxType'),
      type: 'select',
      required: true,
      options: [
        { value: 'default', label: t('settings.finance.financialCodes.editDialog.taxTypeOptions.default') },
        { value: 'no_tax', label: t('settings.finance.financialCodes.editDialog.taxTypeOptions.noTax') },
        { value: 'zero_gst', label: t('settings.finance.financialCodes.editDialog.taxTypeOptions.zeroGst') }
      ]
    },
    { field: 'is_active', label: t('settings.finance.financialCodes.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const FinancialCodeEditDialog = ({ open, code, onClose, onSave }: FinancialCodeEditDialogProps) => {
  const t = useTranslations('admin')
  const financialCodeFormSchema = useMemo(() => buildFinancialCodeFormSchema(t), [t])

  const initialData: Partial<FinancialCode> = code
    ? code
    : {
        code: '',
        name: '',
        description: '',
        tax_type: 'default',
        is_active: true
      }

  const handleSubmit = async (data: Partial<FinancialCode>) => {
    const payload: FinancialCodePayload = {
      code: data.code || '',
      name: data.name || '',
      description: data.description || '',
      tax_type: (data.tax_type as FinancialCodePayload['tax_type']) || 'default',
      is_active: Boolean(data.is_active)
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm schema={financialCodeFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default FinancialCodeEditDialog
