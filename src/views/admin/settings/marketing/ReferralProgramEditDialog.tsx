'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { ReferralProgram, ReferralProgramPayload } from '@/services/marketing'

type ReferralProgramEditDialogProps = {
  open: boolean
  program: ReferralProgram | null
  onClose: () => void
  onSave: (data: ReferralProgramPayload) => Promise<void> | void
}

const buildReferralProgramFormSchema = (t: any): FormSchema => ({
  title: t('settings.marketing.referralPrograms.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.marketing.referralPrograms.editDialog.fields.name'), type: 'string', required: true },
    { field: 'description', label: t('settings.marketing.referralPrograms.editDialog.fields.description'), type: 'textarea' },
    { field: 'referrer_reward', label: t('settings.marketing.referralPrograms.editDialog.fields.referrerReward'), type: 'number', required: true },
    { field: 'referee_reward', label: t('settings.marketing.referralPrograms.editDialog.fields.refereeReward'), type: 'number', required: true },
    { field: 'minimum_purchase', label: t('settings.marketing.referralPrograms.editDialog.fields.minimumPurchase'), type: 'number' },
    { field: 'is_active', label: t('settings.marketing.referralPrograms.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const ReferralProgramEditDialog = ({ open, program, onClose, onSave }: ReferralProgramEditDialogProps) => {
  const t = useTranslations('admin')
  const referralProgramFormSchema = useMemo(() => buildReferralProgramFormSchema(t), [t])

  const initialData: Partial<ReferralProgram> = program
    ? program
    : {
        name: '',
        referrer_reward: 0,
        referee_reward: 0,
        is_active: true
      }

  const handleSubmit = async (data: Partial<ReferralProgram>) => {
    const payload: ReferralProgramPayload = {
      name: data.name || '',
      description: data.description,
      referrer_reward: Number(data.referrer_reward ?? 0),
      referee_reward: Number(data.referee_reward ?? 0),
      minimum_purchase: data.minimum_purchase ? Number(data.minimum_purchase) : undefined,
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
          schema={referralProgramFormSchema}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

export default ReferralProgramEditDialog
