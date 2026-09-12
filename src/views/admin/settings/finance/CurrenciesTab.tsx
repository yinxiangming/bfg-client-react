'use client'

import { useEffect, useMemo, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Switch from '@mui/material/Switch'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { meApi } from '@/utils/meApi'
import CurrencyEditDialog from './CurrencyEditDialog'
import {
  getCurrencies,
  getCurrency,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  enableCurrency,
  disableCurrency,
  type Currency,
  type CurrencyPayload
} from '@/services/finance'

type SchemaOptions = {
  /** Currencies are shared by every shop, so only a platform superuser adds, edits or deletes them. */
  canManageSharedList: boolean
  togglingId: number | null
  onToggle: (currency: Currency, enabled: boolean) => void
}

const buildCurrenciesSchema = (t: any, { canManageSharedList, togglingId, onToggle }: SchemaOptions): ListSchema => ({
  title: t('settings.finance.currencies.tab.title'),
  columns: [
    {
      field: 'code',
      label: t('settings.finance.currencies.tab.columns.name'),
      type: 'string',
      sortable: true,
      ...(canManageSharedList ? { link: 'edit' } : {}),
      render: (value: any, row: Currency) => (
        <span>
          <span style={{ fontWeight: 600, color: 'var(--mui-palette-text-primary)' }}>{row.code}</span>
          {' '}
          <span style={{ color: 'var(--mui-palette-text-secondary)', fontWeight: 400 }}>{row.name}</span>
          {row.is_default && (
            <Chip
              size='small'
              color='primary'
              variant='outlined'
              label={t('settings.finance.currencies.tab.defaultChip')}
              sx={{ ml: 2 }}
            />
          )}
        </span>
      )
    },
    { field: 'symbol', label: t('settings.finance.currencies.tab.columns.symbol'), type: 'string' },
    { field: 'decimal_places', label: t('settings.finance.currencies.tab.columns.decimals'), type: 'number' },
    {
      field: 'is_enabled',
      label: t('settings.finance.currencies.tab.columns.enabled'),
      type: 'boolean',
      render: (value: any, row: Currency) => (
        <Switch
          size='small'
          checked={row.is_enabled !== false}
          // The default currency stays on: the shop prices and invoices in it.
          disabled={Boolean(row.is_default) || togglingId === row.id}
          onClick={event => event.stopPropagation()}
          onChange={(_, checked) => onToggle(row, checked)}
        />
      )
    }
  ],
  searchFields: ['code', 'name'],
  searchPlaceholder: t('settings.finance.currencies.tab.searchPlaceholder'),
  actions: canManageSharedList
    ? [
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
    : []
})

const CurrenciesTab = () => {
  const t = useTranslations('admin')
  const [canManageSharedList, setCanManageSharedList] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    meApi
      .getMe()
      .then(me => {
        if (!cancelled) setCanManageSharedList(Boolean(me?.is_superuser))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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

  const handleToggle = async (currency: Currency, enabled: boolean) => {
    setTogglingId(currency.id)
    setToggleError(null)
    try {
      await (enabled ? enableCurrency(currency.id) : disableCurrency(currency.id))
      await refetch()
    } catch (err: any) {
      setToggleError(t('settings.finance.currencies.tab.errors.toggleFailed', { error: err.message }))
    } finally {
      setTogglingId(null)
    }
  }

  const currenciesSchema = useMemo(
    () => buildCurrenciesSchema(t, { canManageSharedList, togglingId, onToggle: handleToggle }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, canManageSharedList, togglingId]
  )

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
      <Alert severity='info' sx={{ mb: 4 }}>
        {t('settings.finance.currencies.tab.sharedNotice')}
      </Alert>
      {toggleError && (
        <Alert severity='error' sx={{ mb: 4 }} onClose={() => setToggleError(null)}>
          {toggleError}
        </Alert>
      )}
      <SchemaTable
        schema={currenciesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getCurrency(typeof id === 'string' ? parseInt(id) : id)}
      />
      {canManageSharedList && (
        <CurrencyEditDialog
          open={editOpen}
          currency={selected}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  )
}

export default CurrenciesTab
