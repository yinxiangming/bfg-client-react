'use client'

import { useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import ReferralProgramEditDialog from './ReferralProgramEditDialog'
import {
  getReferralPrograms,
  getReferralProgram,
  createReferralProgram,
  updateReferralProgram,
  deleteReferralProgram,
  type ReferralProgram,
  type ReferralProgramPayload
} from '@/services/marketing'

const buildReferralProgramsSchema = (t: any): ListSchema => ({
  title: t('settings.marketing.referralPrograms.tab.title'),
  columns: [
    { field: 'name', label: t('settings.marketing.referralPrograms.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'referrer_reward', label: t('settings.marketing.referralPrograms.tab.columns.referrerReward'), type: 'currency', sortable: true },
    { field: 'referee_reward', label: t('settings.marketing.referralPrograms.tab.columns.refereeReward'), type: 'currency', sortable: true },
    { field: 'minimum_purchase', label: t('settings.marketing.referralPrograms.tab.columns.minPurchase'), type: 'currency', sortable: true },
    { field: 'is_active', label: t('settings.marketing.referralPrograms.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name'],
  actions: [
    { id: 'add', label: t('settings.marketing.referralPrograms.tab.actions.newProgram'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.marketing.referralPrograms.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.marketing.referralPrograms.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.marketing.referralPrograms.tab.actions.confirmDelete')
    }
  ]
})

const ReferralProgramsTab = () => {
  const t = useTranslations('admin')
  const referralProgramsSchema = useMemo(() => buildReferralProgramsSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<ReferralProgram[]>({
    fetchFn: async () => {
      const result = await getReferralPrograms()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<ReferralProgram | null>(null)

  const handleActionClick = async (action: SchemaAction, item: ReferralProgram | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as ReferralProgram)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteReferralProgram((item as ReferralProgram).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.marketing.referralPrograms.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: ReferralProgramPayload) => {
    try {
      if (selected) {
        await updateReferralProgram(selected.id, payload)
      } else {
        await createReferralProgram(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.marketing.referralPrograms.tab.errors.saveFailed', { error: err.message }))
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
        schema={referralProgramsSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getReferralProgram(typeof id === 'string' ? parseInt(id) : id)}
      />
      <ReferralProgramEditDialog
        open={editOpen}
        program={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default ReferralProgramsTab
