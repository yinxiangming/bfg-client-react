'use client'

import { useMemo, useState } from 'react'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import SubscriptionPlanEditDialog from './SubscriptionPlanEditDialog'
import {
  getSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  type SubscriptionPlan,
  type SubscriptionPlanPayload
} from '@/services/store'

const buildSubscriptionPlansSchema = (t: any, locale: string): ListSchema => ({
  title: t('settings.store.subscriptionPlans.tab.title'),
  columns: [
    { field: 'name', label: t('settings.store.subscriptionPlans.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'price', label: t('settings.store.subscriptionPlans.tab.columns.price'), type: 'currency', sortable: true },
    {
      field: 'interval',
      label: t('settings.store.subscriptionPlans.tab.columns.interval'),
      type: 'string',
      sortable: true,
      render: (value, row) => {
        const count = row.interval_count
        const unit = String(value || 'month')
        const unitLabel = t(`settings.store.subscriptionPlans.tab.interval.units.${unit}` as any)
        if (count > 1) {
          const intervalText = locale.startsWith('en') ? `${unitLabel}s` : unitLabel
          return t('settings.store.subscriptionPlans.tab.interval.every', { count, interval: intervalText })
        }
        return t(`settings.store.subscriptionPlans.tab.interval.single.${unit}` as any)
      }
    },
    {
      field: 'trial_period_days',
      label: t('settings.store.subscriptionPlans.tab.columns.trialDays'),
      type: 'number',
      render: (value) => (value > 0 ? t('settings.store.subscriptionPlans.tab.trial.days', { count: value }) : t('settings.store.subscriptionPlans.tab.trial.noTrial'))
    },
    { field: 'is_active', label: t('settings.store.subscriptionPlans.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name'],
  actions: [
    { id: 'add', label: t('settings.store.subscriptionPlans.tab.actions.newPlan'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.store.subscriptionPlans.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.store.subscriptionPlans.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.store.subscriptionPlans.tab.actions.confirmDelete')
    }
  ]
})

const SubscriptionPlansTab = () => {
  const t = useTranslations('admin')
  const locale = useLocale()
  const subscriptionPlansSchema = useMemo(() => buildSubscriptionPlansSchema(t, locale), [t, locale])

  const { data, loading, error, refetch } = useApiData<SubscriptionPlan[]>({
    fetchFn: async () => {
      const result = await getSubscriptionPlans()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null)

  const handleActionClick = async (action: SchemaAction, item: SubscriptionPlan | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as SubscriptionPlan)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteSubscriptionPlan((item as SubscriptionPlan).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.store.subscriptionPlans.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: SubscriptionPlanPayload) => {
    try {
      if (selected) {
        await updateSubscriptionPlan(selected.id, payload)
      } else {
        await createSubscriptionPlan(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.store.subscriptionPlans.tab.errors.saveFailed', { error: err.message }))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    )
  }

  return (
    <>
      <SchemaTable
        schema={subscriptionPlansSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getSubscriptionPlan(typeof id === 'string' ? parseInt(id) : id)}
      />
      <SubscriptionPlanEditDialog
        open={editOpen}
        plan={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default SubscriptionPlansTab
