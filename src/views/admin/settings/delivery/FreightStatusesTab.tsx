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
import FreightStatusEditDialog from './FreightStatusEditDialog'
import {
  getFreightStatuses,
  getFreightStatus,
  createFreightStatus,
  updateFreightStatus,
  deleteFreightStatus,
  type FreightStatus,
  type FreightStatusPayload
} from '@/services/delivery'

const buildFreightStatusesSchema = (t: any): ListSchema => ({
  title: t('settings.delivery.freightStatuses.tab.title'),
  columns: [
    { field: 'name', label: t('settings.delivery.freightStatuses.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.delivery.freightStatuses.tab.columns.code'), type: 'string', sortable: true },
    { field: 'type', label: t('settings.delivery.freightStatuses.tab.columns.type'), type: 'string', sortable: true },
    { field: 'state', label: t('settings.delivery.freightStatuses.tab.columns.state'), type: 'string', sortable: true },
    { field: 'order', label: t('settings.delivery.freightStatuses.tab.columns.order'), type: 'number' },
    { field: 'is_active', label: t('settings.delivery.freightStatuses.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code', 'type', 'state'],
  actions: [
    { id: 'add', label: t('settings.delivery.freightStatuses.tab.actions.newStatus'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.delivery.freightStatuses.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.delivery.freightStatuses.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.delivery.freightStatuses.tab.actions.confirmDelete')
    }
  ]
})

const FreightStatusesTab = () => {
  const t = useTranslations('admin')
  const freightStatusesSchema = useMemo(() => buildFreightStatusesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<FreightStatus[]>({
    fetchFn: async () => {
      const result = await getFreightStatuses()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<FreightStatus | null>(null)

  const handleActionClick = async (action: SchemaAction, item: FreightStatus | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as FreightStatus)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteFreightStatus((item as FreightStatus).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.delivery.freightStatuses.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: FreightStatusPayload) => {
    try {
      if (selected) {
        await updateFreightStatus(selected.id, payload)
      } else {
        await createFreightStatus(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.delivery.freightStatuses.tab.errors.saveFailed', { error: err.message }))
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
        schema={freightStatusesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getFreightStatus(typeof id === 'string' ? parseInt(id) : id)}
      />
      <FreightStatusEditDialog
        open={editOpen}
        statusItem={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default FreightStatusesTab

