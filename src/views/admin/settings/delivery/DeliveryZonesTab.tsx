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
import DeliveryZoneEditDialog from './DeliveryZoneEditDialog'
import {
  getDeliveryZones,
  getDeliveryZone,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  type DeliveryZone,
  type DeliveryZonePayload
} from '@/services/delivery'

const buildDeliveryZonesSchema = (t: any): ListSchema => ({
  title: t('settings.delivery.zones.tab.title'),
  columns: [
    { field: 'name', label: t('settings.delivery.zones.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.delivery.zones.tab.columns.code'), type: 'string', sortable: true },
    { field: 'countries', label: t('settings.delivery.zones.tab.columns.countries'), type: 'string', render: (v) => (Array.isArray(v) ? v.join(', ') : '') },
    { field: 'postal_code_patterns', label: t('settings.delivery.zones.tab.columns.postalCodes'), type: 'string', render: (v) => (Array.isArray(v) ? v.join(', ') : '') },
    { field: 'is_active', label: t('settings.delivery.zones.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code'],
  actions: [
    { id: 'add', label: t('settings.delivery.zones.tab.actions.newZone'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.delivery.zones.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.delivery.zones.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.delivery.zones.tab.actions.confirmDelete')
    }
  ]
})

const DeliveryZonesTab = () => {
  const t = useTranslations('admin')
  const deliveryZonesSchema = useMemo(() => buildDeliveryZonesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<DeliveryZone[]>({
    fetchFn: async () => {
      const result = await getDeliveryZones()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<DeliveryZone | null>(null)

  const handleActionClick = async (action: SchemaAction, item: DeliveryZone | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as DeliveryZone)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteDeliveryZone((item as DeliveryZone).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.delivery.zones.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: DeliveryZonePayload) => {
    try {
      if (selected) {
        await updateDeliveryZone(selected.id, payload)
      } else {
        await createDeliveryZone(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.delivery.zones.tab.errors.saveFailed', { error: err.message }))
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
        schema={deliveryZonesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getDeliveryZone(typeof id === 'string' ? parseInt(id) : id)}
      />
      <DeliveryZoneEditDialog
        open={editOpen}
        zone={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default DeliveryZonesTab

