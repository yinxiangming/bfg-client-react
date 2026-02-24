'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { SalesChannel, SalesChannelPayload } from '@/services/store'

type SalesChannelEditDialogProps = {
  open: boolean
  channel: SalesChannel | null
  onClose: () => void
  onSave: (data: SalesChannelPayload) => Promise<void> | void
}

const buildSalesChannelFormSchema = (t: any): FormSchema => ({
  title: t('settings.store.salesChannels.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.store.salesChannels.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.store.salesChannels.editDialog.fields.code'), type: 'string', required: true },
    {
      field: 'channel_type',
      label: t('settings.store.salesChannels.editDialog.fields.channelType'),
      type: 'select',
      required: true,
      options: [
        { value: 'online_store', label: t('settings.store.salesChannels.editDialog.channelTypeOptions.onlineStore') },
        { value: 'pos', label: t('settings.store.salesChannels.editDialog.channelTypeOptions.pos') },
        { value: 'mobile_app', label: t('settings.store.salesChannels.editDialog.channelTypeOptions.mobileApp') },
        { value: 'social', label: t('settings.store.salesChannels.editDialog.channelTypeOptions.social') },
        { value: 'marketplace', label: t('settings.store.salesChannels.editDialog.channelTypeOptions.marketplace') },
        { value: 'custom', label: t('settings.store.salesChannels.editDialog.channelTypeOptions.custom') }
      ],
      defaultValue: 'custom'
    },
    { field: 'description', label: t('settings.store.salesChannels.editDialog.fields.description'), type: 'textarea', rows: 3 },
    { field: 'is_active', label: t('settings.store.salesChannels.editDialog.fields.active'), type: 'boolean', defaultValue: true },
    { field: 'is_default', label: t('settings.store.salesChannels.editDialog.fields.setDefault'), type: 'boolean', defaultValue: false }
  ]
})

const SalesChannelEditDialog = ({ open, channel, onClose, onSave }: SalesChannelEditDialogProps) => {
  const t = useTranslations('admin')
  const salesChannelFormSchema = useMemo(() => buildSalesChannelFormSchema(t), [t])

  const initialData: Partial<SalesChannel> = channel
    ? channel
    : {
        name: '',
        code: '',
        channel_type: 'custom',
        description: '',
        is_active: true,
        is_default: false
      }

  const handleSubmit = async (data: Partial<SalesChannel>) => {
    const payload: SalesChannelPayload = {
      name: data.name || '',
      code: data.code || '',
      channel_type: (data.channel_type as SalesChannelPayload['channel_type']) || 'custom',
      description: data.description,
      is_active: Boolean(data.is_active),
      is_default: Boolean(data.is_default)
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
        <SchemaForm schema={salesChannelFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default SalesChannelEditDialog
