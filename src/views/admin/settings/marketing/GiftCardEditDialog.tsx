'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { GiftCard, GiftCardPayload } from '@/services/marketing'
import { bfgApi } from '@/utils/api'

type GiftCardEditDialogProps = {
  open: boolean
  giftCard: GiftCard | null
  onClose: () => void
  onSave: (data: GiftCardPayload) => Promise<void> | void
}

const buildGiftCardFormSchema = (t: any): FormSchema => ({
  title: t('settings.marketing.giftCards.editDialog.title'),
  fields: [
    {
      field: 'currency',
      label: t('settings.marketing.giftCards.editDialog.fields.currency'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.currencies(),
      optionLabelTemplate: '{{code}} ({{symbol}})',
      searchable: true,
      searchParam: 'q',
      required: true
    },
    { field: 'initial_value', label: t('settings.marketing.giftCards.editDialog.fields.initialValue'), type: 'number', required: true },
    {
      field: 'customer',
      label: t('settings.marketing.giftCards.editDialog.fields.customerOptional'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.customers(),
      optionLabelTemplate: '{{first_name}} {{last_name}} ({{email}})',
      searchable: true,
      searchParam: 'q'
    },
    { field: 'expires_at', label: t('settings.marketing.giftCards.editDialog.fields.expiresAt'), type: 'datetime' },
    { field: 'is_active', label: t('settings.marketing.giftCards.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const GiftCardEditDialog = ({ open, giftCard, onClose, onSave }: GiftCardEditDialogProps) => {
  const t = useTranslations('admin')
  const giftCardFormSchema = useMemo(() => buildGiftCardFormSchema(t), [t])

  const initialData: Partial<GiftCard> = giftCard
    ? giftCard
    : {
        initial_value: 0,
        is_active: true
      }

  const handleSubmit = async (data: Partial<GiftCard>) => {
    const payload: GiftCardPayload = {
      currency: Number(data.currency),
      initial_value: Number(data.initial_value ?? 0),
      customer: data.customer ? Number(data.customer) : undefined,
      expires_at: data.expires_at,
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
        <SchemaForm schema={giftCardFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default GiftCardEditDialog
