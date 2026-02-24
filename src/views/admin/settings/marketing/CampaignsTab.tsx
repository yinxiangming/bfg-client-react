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
import CampaignEditDialog from './CampaignEditDialog'
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  type Campaign,
  type CampaignPayload
} from '@/services/marketing'

const buildCampaignsSchema = (t: any): ListSchema => ({
  title: t('settings.marketing.campaigns.tab.title'),
  columns: [
    { field: 'name', label: t('settings.marketing.campaigns.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    {
      field: 'campaign_type',
      label: t('settings.marketing.campaigns.tab.columns.type'),
      type: 'string',
      sortable: true,
      render: (value) => (t as any)(`settings.marketing.campaigns.editDialog.typeOptions.${String(value || 'other')}`) as string
    },
    { field: 'start_date', label: t('settings.marketing.campaigns.tab.columns.startDate'), type: 'date', sortable: true },
    { field: 'end_date', label: t('settings.marketing.campaigns.tab.columns.endDate'), type: 'date', sortable: true },
    { field: 'budget', label: t('settings.marketing.campaigns.tab.columns.budget'), type: 'currency', sortable: true },
    { field: 'is_active', label: t('settings.marketing.campaigns.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'campaign_type'],
  actions: [
    { id: 'add', label: t('settings.marketing.campaigns.tab.actions.newCampaign'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.marketing.campaigns.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.marketing.campaigns.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.marketing.campaigns.tab.actions.confirmDelete')
    }
  ]
})

const CampaignsTab = () => {
  const t = useTranslations('admin')
  const campaignsSchema = useMemo(() => buildCampaignsSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Campaign[]>({
    fetchFn: async () => {
      const result = await getCampaigns()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Campaign | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Campaign | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Campaign)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteCampaign((item as Campaign).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.marketing.campaigns.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: CampaignPayload) => {
    try {
      if (selected) {
        await updateCampaign(selected.id, payload)
      } else {
        await createCampaign(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.marketing.campaigns.tab.errors.saveFailed', { error: err.message }))
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
        schema={campaignsSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getCampaign(typeof id === 'string' ? parseInt(id) : id)}
      />
      <CampaignEditDialog
        open={editOpen}
        campaign={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default CampaignsTab
