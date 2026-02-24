'use client'

import { useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { getStores, getStore, deleteStore, type Store } from '@/services/store'

const buildStoresSchema = (t: any): ListSchema => ({
  title: t('stores.schema.title'),
  columns: [
    { field: 'name', label: t('stores.schema.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('stores.schema.columns.code'), type: 'string', sortable: true },
    { field: 'description', label: t('stores.schema.columns.description'), type: 'string' },
    {
      field: 'warehouses',
      label: t('stores.schema.columns.warehouses'),
      type: 'string',
      render: (v, row) => (Array.isArray(row.warehouses) ? row.warehouses.map((w: any) => w.name || w).join(', ') : '')
    },
    { field: 'created_at', label: t('stores.schema.columns.createdAt'), type: 'datetime', sortable: true }
  ],
  searchFields: ['name', 'code'],
  actions: [
    { id: 'add', label: t('stores.actions.add'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('stores.actions.edit'), type: 'secondary', scope: 'row' },
    { id: 'view', label: t('stores.actions.view'), type: 'secondary', scope: 'row' },
    { id: 'delete', label: t('stores.actions.delete'), type: 'danger', scope: 'row', confirm: t('stores.actions.confirmDelete') }
  ]
})

export default function StoresPage() {
  const t = useTranslations('admin')
  const storesSchema = useMemo(() => buildStoresSchema(t), [t])

  const { data: stores, loading, error, refetch } = useApiData<Store[]>({
    fetchFn: getStores
  })

  const handleActionClick = async (action: SchemaAction, item: Store | {}) => {
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteStore(item.id)
        await refetch()
      } catch (err: any) {
        alert(t('stores.errors.deleteFailed', { error: err.message }))
      }
    } else if ((action.id === 'edit' || action.id === 'view') && 'id' in item) {
      // Navigate to edit/view page
      window.location.href = `/admin/store/stores/${item.id}${action.id === 'edit' ? '/edit' : ''}`
    } else if (action.id === 'add') {
      window.location.href = '/admin/store/stores/new'
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
      <Box>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 4 }}>
        {t('stores.page.title')}
      </Typography>
      <SchemaTable
        schema={storesSchema}
        data={stores || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getStore(typeof id === 'string' ? parseInt(id) : id)}
        basePath='/admin/store/stores'
      />
    </Box>
  )
}

