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
import FinancialCodeEditDialog from './FinancialCodeEditDialog'
import {
  getFinancialCodes,
  getFinancialCode,
  createFinancialCode,
  updateFinancialCode,
  deleteFinancialCode,
  type FinancialCode,
  type FinancialCodePayload
} from '@/services/finance'

const buildFinancialCodesSchema = (t: any): ListSchema => ({
  title: t('settings.finance.financialCodes.tab.title'),
  columns: [
    { field: 'code', label: t('settings.finance.financialCodes.tab.columns.code'), type: 'string', sortable: true, link: 'edit' },
    { field: 'name', label: t('settings.finance.financialCodes.tab.columns.name'), type: 'string', sortable: true },
    { field: 'tax_type', label: t('settings.finance.financialCodes.tab.columns.taxType'), type: 'select' },
    { field: 'is_active', label: t('settings.finance.financialCodes.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['code', 'name'],
  actions: [
    { id: 'add', label: t('settings.finance.financialCodes.tab.actions.new'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.finance.financialCodes.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.finance.financialCodes.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.finance.financialCodes.tab.actions.confirmDelete')
    }
  ]
})

const FinancialCodesTab = () => {
  const t = useTranslations('admin')
  const financialCodesSchema = useMemo(() => buildFinancialCodesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<FinancialCode[]>({
    fetchFn: async () => {
      const result = await getFinancialCodes()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<FinancialCode | null>(null)

  const handleActionClick = async (action: SchemaAction, item: FinancialCode | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as FinancialCode)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteFinancialCode((item as FinancialCode).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.finance.financialCodes.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: FinancialCodePayload) => {
    try {
      if (selected) {
        await updateFinancialCode(selected.id, payload)
      } else {
        await createFinancialCode(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.finance.financialCodes.tab.errors.saveFailed', { error: err.message }))
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
        schema={financialCodesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getFinancialCode(typeof id === 'string' ? parseInt(id) : id)}
      />
      <FinancialCodeEditDialog
        open={editOpen}
        code={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default FinancialCodesTab
