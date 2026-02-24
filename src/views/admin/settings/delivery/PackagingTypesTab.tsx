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
import PackagingTypeEditDialog from './PackagingTypeEditDialog'
import {
  getPackagingTypes,
  getPackagingType,
  createPackagingType,
  updatePackagingType,
  deletePackagingType,
  type PackagingType,
  type PackagingTypePayload
} from '@/services/delivery'

const buildPackagingTypesSchema = (t: any): ListSchema => ({
  title: t('settings.delivery.packagingTypes.tab.title'),
  columns: [
    { field: 'name', label: t('settings.delivery.packagingTypes.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.delivery.packagingTypes.tab.columns.code'), type: 'string', sortable: true },
    { field: 'description', label: t('settings.delivery.packagingTypes.tab.columns.description'), type: 'string' },
    { field: 'order', label: t('settings.delivery.packagingTypes.tab.columns.order'), type: 'number' },
    { field: 'is_active', label: t('settings.delivery.packagingTypes.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code'],
  actions: [
    { id: 'add', label: t('settings.delivery.packagingTypes.tab.actions.newPackaging'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.delivery.packagingTypes.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.delivery.packagingTypes.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.delivery.packagingTypes.tab.actions.confirmDelete')
    }
  ]
})

const PackagingTypesTab = () => {
  const t = useTranslations('admin')
  const packagingTypesSchema = useMemo(() => buildPackagingTypesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<PackagingType[]>({
    fetchFn: async () => {
      const result = await getPackagingTypes()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<PackagingType | null>(null)

  const handleActionClick = async (action: SchemaAction, item: PackagingType | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as PackagingType)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deletePackagingType((item as PackagingType).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.delivery.packagingTypes.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: PackagingTypePayload) => {
    try {
      if (selected) {
        await updatePackagingType(selected.id, payload)
      } else {
        await createPackagingType(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.delivery.packagingTypes.tab.errors.saveFailed', { error: err.message }))
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
        schema={packagingTypesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getPackagingType(typeof id === 'string' ? parseInt(id) : id)}
      />
      <PackagingTypeEditDialog
        open={editOpen}
        packagingType={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default PackagingTypesTab

