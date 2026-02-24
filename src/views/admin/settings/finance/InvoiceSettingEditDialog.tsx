'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { InvoiceSetting, InvoiceSettingPayload } from '@/services/finance'

type InvoiceSettingEditDialogProps = {
  open: boolean
  setting: InvoiceSetting | null
  onClose: () => void
  onSave: (data: InvoiceSettingPayload) => Promise<void> | void
}

const buildInvoiceSettingFormSchema = (t: any): FormSchema => ({
  title: t('settings.finance.invoiceSettings.editDialog.title'),
  fields: [
    { field: 'invoice_prefix', label: t('settings.finance.invoiceSettings.editDialog.fields.invoicePrefix'), type: 'string', required: true },
    { field: 'default_due_days', label: t('settings.finance.invoiceSettings.editDialog.fields.defaultDueDays'), type: 'number', required: true },
    { field: 'default_footer', label: t('settings.finance.invoiceSettings.editDialog.fields.defaultFooter'), type: 'textarea' },
    { field: 'enable_auto_number', label: t('settings.finance.invoiceSettings.editDialog.fields.autoNumber'), type: 'boolean', defaultValue: true },
    { field: 'email_template_id', label: t('settings.finance.invoiceSettings.editDialog.fields.emailTemplateId'), type: 'number' },
    { field: 'is_active', label: t('settings.finance.invoiceSettings.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const InvoiceSettingEditDialog = ({ open, setting, onClose, onSave }: InvoiceSettingEditDialogProps) => {
  const t = useTranslations('admin')
  const invoiceSettingFormSchema = useMemo(() => buildInvoiceSettingFormSchema(t), [t])

  const initialData: Partial<InvoiceSetting> = setting
    ? setting
    : {
        invoice_prefix: 'INV-',
        default_due_days: 30,
        default_footer: '',
        enable_auto_number: true,
        email_template_id: undefined,
        is_active: true
      }

  const handleSubmit = async (data: Partial<InvoiceSetting>) => {
    const payload: InvoiceSettingPayload = {
      invoice_prefix: data.invoice_prefix || '',
      default_due_days: Number(data.default_due_days ?? 30),
      default_footer: data.default_footer || '',
      enable_auto_number: Boolean(data.enable_auto_number),
      email_template_id: data.email_template_id ? Number(data.email_template_id) : undefined,
      is_active: data.is_active ?? true
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
        <SchemaForm schema={invoiceSettingFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default InvoiceSettingEditDialog
