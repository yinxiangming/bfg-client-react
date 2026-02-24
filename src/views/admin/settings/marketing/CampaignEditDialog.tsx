'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Campaign, CampaignPayload } from '@/services/marketing'

type CampaignEditDialogProps = {
  open: boolean
  campaign: Campaign | null
  onClose: () => void
  onSave: (data: CampaignPayload) => Promise<void> | void
}

const buildCampaignFormSchema = (t: any): FormSchema => ({
  title: t('settings.marketing.campaigns.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.marketing.campaigns.editDialog.fields.name'), type: 'string', required: true },
    {
      field: 'campaign_type',
      label: t('settings.marketing.campaigns.editDialog.fields.type'),
      type: 'select',
      required: true,
      options: [
        { value: 'email', label: t('settings.marketing.campaigns.editDialog.typeOptions.email') },
        { value: 'sms', label: t('settings.marketing.campaigns.editDialog.typeOptions.sms') },
        { value: 'social', label: t('settings.marketing.campaigns.editDialog.typeOptions.social') },
        { value: 'affiliate', label: t('settings.marketing.campaigns.editDialog.typeOptions.affiliate') },
        { value: 'other', label: t('settings.marketing.campaigns.editDialog.typeOptions.other') }
      ]
    },
    { field: 'description', label: t('settings.marketing.campaigns.editDialog.fields.description'), type: 'textarea' },
    { field: 'start_date', label: t('settings.marketing.campaigns.editDialog.fields.startDate'), type: 'datetime', required: true },
    { field: 'end_date', label: t('settings.marketing.campaigns.editDialog.fields.endDate'), type: 'datetime' },
    { field: 'budget', label: t('settings.marketing.campaigns.editDialog.fields.budget'), type: 'number' },
    { field: 'is_active', label: t('settings.marketing.campaigns.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const CampaignEditDialog = ({ open, campaign, onClose, onSave }: CampaignEditDialogProps) => {
  const t = useTranslations('admin')
  const campaignFormSchema = useMemo(() => buildCampaignFormSchema(t), [t])

  const initialData: Partial<Campaign> = campaign
    ? campaign
    : {
        name: '',
        campaign_type: 'email',
        start_date: new Date().toISOString(),
        is_active: true
      }

  const handleSubmit = async (data: Partial<Campaign>) => {
    const payload: CampaignPayload = {
      name: data.name || '',
      campaign_type: data.campaign_type || 'email',
      description: data.description,
      start_date: data.start_date || new Date().toISOString(),
      end_date: data.end_date,
      budget: data.budget,
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
        <SchemaForm schema={campaignFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default CampaignEditDialog
