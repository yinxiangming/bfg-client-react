'use client'

import { useEffect, useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { usePagedData } from '@/hooks/usePagedData'
import PickupPointEditDialog from './PickupPointEditDialog'
import {
  getPickupPointsPage,
  createPickupPoint,
  updatePickupPoint,
  deletePickupPoint,
  getWarehousesPage,
  type PickupPoint,
  type PickupPointPayload,
  type Warehouse
} from '@/services/delivery'

const buildSchema = (t: any): ListSchema => ({
  title: t('settings.delivery.pickupPoints.tab.title'),
  columns: [
    { field: 'name', label: t('settings.delivery.pickupPoints.tab.columns.name'), type: 'string', width: 160, sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.delivery.pickupPoints.tab.columns.code'), type: 'string', width: 110, sortable: true },
    {
      field: 'address_line1',
      label: t('settings.delivery.pickupPoints.tab.columns.address'),
      type: 'string',
      width: 260,
      render: (_value: any, row: any) => {
        // Google answers "Auckland" for both city and region of an Auckland
        // address; printing it twice reads as a bug, so drop repeats.
        const parts: string[] = []
        for (const part of [row.address_line1, row.address_line2, row.city, row.state, row.postal_code, row.country]) {
          const trimmed = (part || '').trim()
          if (trimmed && !parts.includes(trimmed)) parts.push(trimmed)
        }
        return parts.length ? parts.join(', ') : '-'
      }
    },
    { field: 'phone', label: t('settings.delivery.pickupPoints.tab.columns.phone'), type: 'string', width: 130 },
    { field: 'fee', label: t('settings.delivery.pickupPoints.tab.columns.fee'), type: 'currency', width: 90 },
    { field: 'is_active', label: t('settings.delivery.pickupPoints.tab.columns.status'), type: 'select', width: 90, sortable: true },
    {
      field: 'is_default',
      label: t('settings.delivery.pickupPoints.tab.columns.default'),
      type: 'string',
      width: 90,
      sortable: true,
      // SchemaTable turns any boolean into an Active/Inactive chip, which under
      // a "Default" heading reads as a different fact than the one being shown.
      render: (value: any) => (value ? '✓' : '—')
    }
  ],
  searchFields: ['name', 'code', 'city', 'address_line1', 'phone'],
  actions: [
    { id: 'add', label: t('settings.delivery.pickupPoints.tab.actions.newPoint'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.delivery.pickupPoints.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.delivery.pickupPoints.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.delivery.pickupPoints.tab.actions.confirmDelete')
    }
  ]
})

const PickupPointsTab = () => {
  const t = useTranslations('admin')
  const schema = useMemo(() => buildSchema(t), [t])

  const { items: data, loading, error, serverPagination, onSearchChange, refetch } =
    usePagedData<PickupPoint>(getPickupPointsPage)

  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<PickupPoint | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  // For the "stock comes from" picker. A failure here only costs that one
  // optional field, so it must not take the tab down with it.
  useEffect(() => {
    getWarehousesPage({ page_size: 200 })
      .then(({ results }) => setWarehouses(results))
      .catch(() => setWarehouses([]))
  }, [])

  const handleActionClick = async (action: SchemaAction, item: PickupPoint | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as PickupPoint)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deletePickupPoint((item as PickupPoint).id)
        await refetch()
      } catch (err: any) {
        // The FK from Order is PROTECT: a point with history cannot be deleted,
        // which is the point. Deactivate it instead.
        alert(t('settings.delivery.pickupPoints.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: PickupPointPayload) => {
    try {
      if (selected) {
        await updatePickupPoint(selected.id, payload)
      } else {
        await createPickupPoint(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.delivery.pickupPoints.tab.errors.saveFailed', { error: err.message }))
    }
  }

  if (loading && !data) {
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
        schema={schema}
        data={data || []}
        loading={loading}
        onActionClick={handleActionClick}
        serverPagination={serverPagination}
        onSearchChange={onSearchChange}
      />
      <PickupPointEditDialog
        open={editOpen}
        point={selected}
        warehouses={warehouses}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default PickupPointsTab
