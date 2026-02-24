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
import CurrencyEditDialog from './CurrencyEditDialog'
import {
  getCurrencies,
  getCurrency,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  type Currency,
  type CurrencyPayload
} from '@/services/finance'

const buildCurrenciesSchema = (t: any): ListSchema => ({
  title: t('settings.finance.currencies.tab.title'),
  columns: [
    { 
      field: 'code', 
      label: t('settings.finance.currencies.tab.columns.name'), 
      type: 'string', 
      sortable: true, 
      link: 'edit',
      render: (value: any, row: Currency) => (
        <span>
          <span style={{ fontWeight: 600, color: 'var(--mui-palette-text-primary)' }}>{row.code}</span>
          {' '}
          <span style={{ color: 'var(--mui-palette-text-secondary)', fontWeight: 400 }}>{row.name}</span>
        </span>
      )
    },
    { field: 'symbol', label: t('settings.finance.currencies.tab.columns.symbol'), type: 'string' },
    { field: 'decimal_places', label: t('settings.finance.currencies.tab.columns.decimals'), type: 'number' },
    { field: 'is_active', label: t('settings.finance.currencies.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['code', 'name'],
  searchPlaceholder: t('settings.finance.currencies.tab.searchPlaceholder'),
  filters: [
    {
      field: 'currency_type',
      label: t('settings.finance.currencies.tab.filters.currencyType.label'),
      type: 'select',
      options: [
        { value: 'fiat', label: t('settings.finance.currencies.tab.filters.currencyType.options.fiat') },
        { value: 'crypto', label: t('settings.finance.currencies.tab.filters.currencyType.options.crypto') }
      ]
    },
    {
      field: 'region',
      label: t('settings.finance.currencies.tab.filters.region.label'),
      type: 'select',
      options: [
        { value: 'americas', label: t('settings.finance.currencies.tab.filters.region.options.americas') },
        { value: 'europe', label: t('settings.finance.currencies.tab.filters.region.options.europe') },
        { value: 'asia', label: t('settings.finance.currencies.tab.filters.region.options.asia') },
        { value: 'oceania', label: t('settings.finance.currencies.tab.filters.region.options.oceania') },
        { value: 'africa', label: t('settings.finance.currencies.tab.filters.region.options.africa') }
      ]
    }
  ],
  actions: [
    { id: 'add', label: t('settings.finance.currencies.tab.actions.addNew'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.finance.currencies.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.finance.currencies.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.finance.currencies.tab.actions.confirmDelete')
    }
  ]
})

const CurrenciesTab = () => {
  const t = useTranslations('admin')
  const currenciesSchema = useMemo(() => buildCurrenciesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Currency[]>({
    fetchFn: async () => {
      const result = await getCurrencies()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Currency | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Currency | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Currency)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteCurrency((item as Currency).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.finance.currencies.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: CurrencyPayload) => {
    try {
      if (selected) {
        await updateCurrency(selected.id, payload)
      } else {
        await createCurrency(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.finance.currencies.tab.errors.saveFailed', { error: err.message }))
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
        schema={currenciesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getCurrency(typeof id === 'string' ? parseInt(id) : id)}
      />
      <CurrencyEditDialog
        open={editOpen}
        currency={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default CurrenciesTab
