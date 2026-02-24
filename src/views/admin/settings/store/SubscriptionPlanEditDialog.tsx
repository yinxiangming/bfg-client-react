'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { SubscriptionPlan, SubscriptionPlanPayload } from '@/services/store'

type SubscriptionPlanFormData = Omit<SubscriptionPlanPayload, 'features'> & {
  features?: string
}

type SubscriptionPlanEditDialogProps = {
  open: boolean
  plan: SubscriptionPlan | null
  onClose: () => void
  onSave: (data: SubscriptionPlanPayload) => Promise<void> | void
}

const buildSubscriptionPlanFormSchema = (t: any): FormSchema => ({
  title: t('settings.store.subscriptionPlans.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.store.subscriptionPlans.editDialog.fields.planName'), type: 'string', required: true },
    { field: 'description', label: t('settings.store.subscriptionPlans.editDialog.fields.description'), type: 'textarea', rows: 2 },
    { field: 'price', label: t('settings.store.subscriptionPlans.editDialog.fields.price'), type: 'number', required: true },
    {
      field: 'interval',
      label: t('settings.store.subscriptionPlans.editDialog.fields.interval'),
      type: 'select',
      required: true,
      options: [
        { value: 'day', label: t('settings.store.subscriptionPlans.editDialog.intervalOptions.day') },
        { value: 'week', label: t('settings.store.subscriptionPlans.editDialog.intervalOptions.week') },
        { value: 'month', label: t('settings.store.subscriptionPlans.editDialog.intervalOptions.month') },
        { value: 'year', label: t('settings.store.subscriptionPlans.editDialog.intervalOptions.year') }
      ],
      defaultValue: 'month'
    },
    { field: 'interval_count', label: t('settings.store.subscriptionPlans.editDialog.fields.intervalCount'), type: 'number', defaultValue: 1 },
    { field: 'trial_period_days', label: t('settings.store.subscriptionPlans.editDialog.fields.trialPeriodDays'), type: 'number', defaultValue: 0 },
    { field: 'features', label: t('settings.store.subscriptionPlans.editDialog.fields.features'), type: 'textarea', rows: 5 },
    { field: 'is_active', label: t('settings.store.subscriptionPlans.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

const SubscriptionPlanEditDialog = ({ open, plan, onClose, onSave }: SubscriptionPlanEditDialogProps) => {
  const t = useTranslations('admin')
  const subscriptionPlanFormSchema = useMemo(() => buildSubscriptionPlanFormSchema(t), [t])

  const initialData: Partial<SubscriptionPlanFormData> = plan
    ? {
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        interval: plan.interval,
        interval_count: plan.interval_count,
        trial_period_days: plan.trial_period_days,
        features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
        is_active: plan.is_active
      }
    : {
        name: '',
        description: '',
        price: 0,
        interval: 'month',
        interval_count: 1,
        trial_period_days: 0,
        features: '',
        is_active: true
      }

  const handleSubmit = async (data: Partial<SubscriptionPlanFormData>) => {
    // Convert features from textarea (newline-separated) to array
    const featuresArray = data.features
      ? data.features.split('\n').map(f => f.trim()).filter(f => f.length > 0)
      : []
    
    const payload: SubscriptionPlanPayload = {
      name: data.name || '',
      description: data.description,
      price: Number(data.price) || 0,
      interval: (data.interval as SubscriptionPlanPayload['interval']) || 'month',
      interval_count: Number(data.interval_count) || 1,
      trial_period_days: Number(data.trial_period_days) || 0,
      features: featuresArray,
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
        <SchemaForm schema={subscriptionPlanFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default SubscriptionPlanEditDialog

