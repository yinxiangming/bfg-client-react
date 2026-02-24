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
import TaxRateEditDialog from './TaxRateEditDialog'
import {
  getTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  type TaxRate,
  type TaxRatePayload
} from '@/services/finance'

const buildTaxRatesSchema = (t: any): ListSchema => ({
  title: t('settings.finance.taxRates.tab.title'),
  columns: [
    { field: 'name', label: t('settings.finance.taxRates.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    {
      field: 'rate',
      label: t('settings.finance.taxRates.tab.columns.rate'),
      type: 'number',
      render: (value) => `${value}%`
    },
    { field: 'country', label: t('settings.finance.taxRates.tab.columns.country'), type: 'string', sortable: true },
    { field: 'state', label: t('settings.finance.taxRates.tab.columns.state'), type: 'string' },
    { field: 'is_active', label: t('settings.finance.taxRates.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'country', 'state'],
  actions: [
    { id: 'add', label: t('settings.finance.taxRates.tab.actions.newTaxRate'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.finance.taxRates.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.finance.taxRates.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.finance.taxRates.tab.actions.confirmDelete')
    }
  ]
})

const TaxRatesTab = () => {
  const t = useTranslations('admin')
  const taxRatesSchema = useMemo(() => buildTaxRatesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<TaxRate[]>({
    fetchFn: async () => {
      const result = await getTaxRates()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<TaxRate | null>(null)

  const handleActionClick = async (action: SchemaAction, item: TaxRate | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as TaxRate)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteTaxRate((item as TaxRate).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.finance.taxRates.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: TaxRatePayload) => {
    try {
      if (selected) {
        await updateTaxRate(selected.id, payload)
      } else {
        await createTaxRate(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.finance.taxRates.tab.errors.saveFailed', { error: err.message }))
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
        schema={taxRatesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getTaxRate(typeof id === 'string' ? parseInt(id) : id)}
      />
      <TaxRateEditDialog
        open={editOpen}
        taxRate={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default TaxRatesTab
