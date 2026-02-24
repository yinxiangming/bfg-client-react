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
import WarehouseEditDialog from './WarehouseEditDialog'
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  type Warehouse,
  type WarehousePayload
} from '@/services/delivery'

const buildWarehousesSchema = (t: any): ListSchema => ({
  title: t('settings.delivery.warehouses.tab.title'),
  columns: [
    { field: 'name', label: t('settings.delivery.warehouses.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.delivery.warehouses.tab.columns.code'), type: 'string', sortable: true },
    { 
      field: 'address_line1', 
      label: t('settings.delivery.warehouses.tab.columns.address'), 
      type: 'string',
      render: (value: any, row: any) => {
        const parts = []
        if (row.address_line1) parts.push(row.address_line1)
        if (row.address_line2) parts.push(row.address_line2)
        if (row.city) parts.push(row.city)
        if (row.state) parts.push(row.state)
        if (row.postal_code) parts.push(row.postal_code)
        if (row.country) parts.push(row.country)
        return parts.length > 0 ? parts.join(', ') : '-'
      }
    },
    { field: 'city', label: t('settings.delivery.warehouses.tab.columns.city'), type: 'string', sortable: true },
    { field: 'country', label: t('settings.delivery.warehouses.tab.columns.country'), type: 'string', sortable: true },
    { field: 'phone', label: t('settings.delivery.warehouses.tab.columns.phone'), type: 'string' },
    { field: 'is_active', label: t('settings.delivery.warehouses.tab.columns.status'), type: 'select', sortable: true },
    { field: 'is_default', label: t('settings.delivery.warehouses.tab.columns.default'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code', 'city', 'address_line1', 'phone'],
  actions: [
    { id: 'add', label: t('settings.delivery.warehouses.tab.actions.newWarehouse'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.delivery.warehouses.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.delivery.warehouses.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.delivery.warehouses.tab.actions.confirmDelete')
    }
  ]
})

const WarehousesTab = () => {
  const t = useTranslations('admin')
  const warehousesSchema = useMemo(() => buildWarehousesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Warehouse[]>({
    fetchFn: async () => {
      const result = await getWarehouses()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Warehouse | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Warehouse | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Warehouse)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteWarehouse((item as Warehouse).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.delivery.warehouses.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: WarehousePayload) => {
    try {
      if (selected) {
        await updateWarehouse(selected.id, payload)
      } else {
        await createWarehouse(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.delivery.warehouses.tab.errors.saveFailed', { error: err.message }))
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
        schema={warehousesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getWarehouse(typeof id === 'string' ? parseInt(id) : id)}
      />
      <WarehouseEditDialog
        open={editOpen}
        warehouse={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default WarehousesTab

