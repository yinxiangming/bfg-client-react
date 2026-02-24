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
import StoreEditDialog from './StoreEditDialog'
import {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  type Store,
  type StorePayload
} from '@/services/store'

const buildStoresSchema = (t: any): ListSchema => ({
  title: t('settings.store.stores.tab.title'),
  columns: [
    { field: 'name', label: t('settings.store.stores.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.store.stores.tab.columns.code'), type: 'string', sortable: true },
    { field: 'description', label: t('settings.store.stores.tab.columns.description'), type: 'string' },
    { field: 'is_active', label: t('settings.store.stores.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code'],
  actions: [
    { id: 'add', label: t('settings.store.stores.tab.actions.newStore'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.store.stores.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.store.stores.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.store.stores.tab.actions.confirmDelete')
    }
  ]
})

const StoresTab = () => {
  const t = useTranslations('admin')
  const storesSchema = useMemo(() => buildStoresSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Store[]>({
    fetchFn: async () => {
      const result = await getStores()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Store | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Store | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Store)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteStore((item as Store).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.store.stores.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: StorePayload) => {
    try {
      if (selected) {
        await updateStore(selected.id, payload)
      } else {
        await createStore(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.store.stores.tab.errors.saveFailed', { error: err.message }))
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
        schema={storesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getStore(typeof id === 'string' ? parseInt(id) : id)}
      />
      <StoreEditDialog
        open={editOpen}
        store={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default StoresTab
