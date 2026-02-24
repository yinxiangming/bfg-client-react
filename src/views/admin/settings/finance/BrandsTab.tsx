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
import BrandEditDialog from './BrandEditDialog'
import {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  type Brand,
  type BrandPayload
} from '@/services/finance'

const buildBrandsSchema = (t: any): ListSchema => ({
  title: t('settings.finance.brands.tab.title'),
  columns: [
    { field: 'name', label: t('settings.finance.brands.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'tax_id', label: t('settings.finance.brands.tab.columns.taxId'), type: 'string' },
    { field: 'registration_number', label: t('settings.finance.brands.tab.columns.registrationNumber'), type: 'string' },
    {
      field: 'is_default',
      label: t('settings.finance.brands.tab.columns.default'),
      type: 'select',
      render: (value) => (value ? t('settings.finance.brands.tab.values.yes') : t('settings.finance.brands.tab.values.no'))
    },
    { field: 'is_active', label: t('settings.finance.brands.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'tax_id'],
  actions: [
    { id: 'add', label: t('settings.finance.brands.tab.actions.newBrand'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.finance.brands.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.finance.brands.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.finance.brands.tab.actions.confirmDelete')
    }
  ]
})

const BrandsTab = () => {
  const t = useTranslations('admin')
  const brandsSchema = useMemo(() => buildBrandsSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Brand[]>({
    fetchFn: async () => {
      const result = await getBrands()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Brand | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Brand | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Brand)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteBrand((item as Brand).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.finance.brands.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: BrandPayload) => {
    try {
      if (selected) {
        await updateBrand(selected.id, payload)
      } else {
        await createBrand(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.finance.brands.tab.errors.saveFailed', { error: err.message }))
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
        schema={brandsSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getBrand(typeof id === 'string' ? parseInt(id) : id)}
      />
      <BrandEditDialog
        open={editOpen}
        brand={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default BrandsTab
