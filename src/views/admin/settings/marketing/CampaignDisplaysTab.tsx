'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import CampaignDisplayEditDialog from './CampaignDisplayEditDialog'
import {
  getCampaignDisplays,
  createCampaignDisplay,
  updateCampaignDisplay,
  deleteCampaignDisplay,
  type CampaignDisplay,
  type CampaignDisplayPayload
} from '@/services/marketing'

const DISPLAY_TYPE_KEYS: Record<string, string> = {
  slide: 'slide',
  category_entry: 'categoryEntry',
  featured: 'featured'
}

const buildSchema = (t: any): ListSchema => ({
  title: t('settings.marketing.campaignDisplays.tab.title'),
  columns: [
    { field: 'campaign_name', label: t('settings.marketing.campaignDisplays.tab.columns.campaign'), type: 'string', sortable: true, link: 'edit' },
    { field: 'title', label: t('settings.marketing.campaignDisplays.tab.columns.title'), type: 'string', sortable: true },
    {
      field: 'display_type',
      label: t('settings.marketing.campaignDisplays.tab.columns.displayType'),
      type: 'string',
      sortable: true,
      render: (value) => t(`settings.marketing.campaignDisplays.editDialog.displayTypeOptions.${DISPLAY_TYPE_KEYS[String(value)] || value}`)
    },
    { field: 'order', label: t('settings.marketing.campaignDisplays.tab.columns.order'), type: 'number', sortable: true },
    { field: 'link_url', label: t('settings.marketing.campaignDisplays.tab.columns.linkUrl'), type: 'string' },
    { field: 'is_active', label: t('settings.marketing.campaignDisplays.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['campaign_name'],
  actions: [
    { id: 'add', label: t('settings.marketing.campaignDisplays.tab.actions.newDisplay'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.marketing.campaignDisplays.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.marketing.campaignDisplays.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.marketing.campaignDisplays.tab.actions.confirmDelete')
    }
  ]
})

const CampaignDisplaysTab = () => {
  const t = useTranslations('admin')
  const schema = useMemo(() => buildSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<CampaignDisplay[]>({
    fetchFn: async () => {
      const result = await getCampaignDisplays()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<CampaignDisplay | null>(null)

  const handleActionClick = async (action: SchemaAction, item: CampaignDisplay | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as CampaignDisplay)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteCampaignDisplay((item as CampaignDisplay).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.marketing.campaignDisplays.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: CampaignDisplayPayload) => {
    try {
      if (selected) {
        await updateCampaignDisplay(selected.id, payload)
      } else {
        await createCampaignDisplay(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.marketing.campaignDisplays.tab.errors.saveFailed', { error: err.message }))
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
      <Alert severity='error' sx={{ m: 2 }}>
        {error.message}
      </Alert>
    )
  }

  return (
    <>
      <SchemaTable schema={schema} data={data || []} onActionClick={handleActionClick} />
      <CampaignDisplayEditDialog open={editOpen} display={selected} onClose={() => setEditOpen(false)} onSave={handleSave} />
    </>
  )
}

export default CampaignDisplaysTab
