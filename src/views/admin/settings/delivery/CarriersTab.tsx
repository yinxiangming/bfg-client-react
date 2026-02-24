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
import CarrierEditDialog from './CarrierEditDialog'
import {
  getCarriers,
  getCarrier,
  createCarrier,
  updateCarrier,
  deleteCarrier,
  getCarrierPlugins,
  type Carrier,
  type CarrierPayload,
  type CarrierPluginInfo
} from '@/services/delivery'

const buildCarriersSchema = (t: any): ListSchema => ({
  title: t('settings.delivery.carriers.tab.title'),
  columns: [
    { field: 'name', label: t('settings.delivery.carriers.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.delivery.carriers.tab.columns.code'), type: 'string', sortable: true },
    { field: 'tracking_url_template', label: t('settings.delivery.carriers.tab.columns.trackingUrl'), type: 'string' },
    { field: 'is_active', label: t('settings.delivery.carriers.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code'],
  actions: [
    { id: 'add', label: t('settings.delivery.carriers.tab.actions.newCarrier'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.delivery.carriers.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.delivery.carriers.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.delivery.carriers.tab.actions.confirmDelete')
    }
  ]
})

const CarriersTab = () => {
  const t = useTranslations('admin')
  const carriersSchema = useMemo(() => buildCarriersSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Carrier[]>({
    fetchFn: async () => {
      const result = await getCarriers()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const { data: plugins } = useApiData<CarrierPluginInfo[]>({
    fetchFn: getCarrierPlugins
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Carrier | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Carrier | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Carrier)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteCarrier((item as Carrier).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.delivery.carriers.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: CarrierPayload) => {
    try {
      if (selected) {
        await updateCarrier(selected.id, payload)
      } else {
        await createCarrier(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.delivery.carriers.tab.errors.saveFailed', { error: err.message }))
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
        schema={carriersSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getCarrier(typeof id === 'string' ? parseInt(id) : id)}
      />
      <CarrierEditDialog
        open={editOpen}
        carrier={selected}
        carrierPlugins={plugins || []}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default CarriersTab

