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
import SalesChannelEditDialog from './SalesChannelEditDialog'
import {
  getSalesChannels,
  getSalesChannel,
  createSalesChannel,
  updateSalesChannel,
  deleteSalesChannel,
  type SalesChannel,
  type SalesChannelPayload
} from '@/services/store'

const toChannelTypeKey = (value?: string) => {
  switch (value) {
    case 'online_store':
    case 'online':
      return 'onlineStore'
    case 'mobile_app':
    case 'mobile':
      return 'mobileApp'
    default:
      return value || 'custom'
  }
}

const buildSalesChannelsSchema = (t: any): ListSchema => ({
  title: t('settings.store.salesChannels.tab.title'),
  columns: [
    { field: 'name', label: t('settings.store.salesChannels.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.store.salesChannels.tab.columns.code'), type: 'string', sortable: true },
    {
      field: 'channel_type',
      label: t('settings.store.salesChannels.tab.columns.channelType'),
      type: 'select',
      sortable: true,
      render: (value) => {
        const key = toChannelTypeKey(value)
        return (t as any)(`settings.store.salesChannels.editDialog.channelTypeOptions.${key}`) as string
      }
    },
    {
      field: 'is_default',
      label: t('settings.store.salesChannels.tab.columns.default'),
      type: 'select',
      render: (value) => (value ? t('settings.store.salesChannels.tab.values.yes') : t('settings.store.salesChannels.tab.values.no'))
    },
    { field: 'is_active', label: t('settings.store.salesChannels.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code'],
  actions: [
    { id: 'add', label: t('settings.store.salesChannels.tab.actions.newChannel'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.store.salesChannels.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.store.salesChannels.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.store.salesChannels.tab.actions.confirmDelete')
    }
  ]
})

const SalesChannelsTab = () => {
  const t = useTranslations('admin')
  const salesChannelsSchema = useMemo(() => buildSalesChannelsSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<SalesChannel[]>({
    fetchFn: async () => {
      const result = await getSalesChannels()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<SalesChannel | null>(null)

  const handleActionClick = async (action: SchemaAction, item: SalesChannel | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as SalesChannel)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteSalesChannel((item as SalesChannel).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.store.salesChannels.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: SalesChannelPayload) => {
    try {
      if (selected) {
        await updateSalesChannel(selected.id, payload)
      } else {
        await createSalesChannel(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.store.salesChannels.tab.errors.saveFailed', { error: err.message }))
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
        schema={salesChannelsSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getSalesChannel(typeof id === 'string' ? parseInt(id) : id)}
      />
      <SalesChannelEditDialog
        open={editOpen}
        channel={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default SalesChannelsTab
