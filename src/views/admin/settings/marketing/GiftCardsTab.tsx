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
import GiftCardEditDialog from './GiftCardEditDialog'
import {
  getGiftCards,
  getGiftCard,
  createGiftCard,
  updateGiftCard,
  deleteGiftCard,
  deactivateGiftCard,
  type GiftCard,
  type GiftCardPayload
} from '@/services/marketing'

const buildGiftCardsSchema = (t: any): ListSchema => ({
  title: t('settings.marketing.giftCards.tab.title'),
  columns: [
    { field: 'code', label: t('settings.marketing.giftCards.tab.columns.code'), type: 'string', sortable: true, link: 'edit' },
    { field: 'initial_value', label: t('settings.marketing.giftCards.tab.columns.initialValue'), type: 'currency', sortable: true },
    { field: 'balance', label: t('settings.marketing.giftCards.tab.columns.balance'), type: 'currency', sortable: true },
    { field: 'currency_code', label: t('settings.marketing.giftCards.tab.columns.currency'), type: 'string' },
    { field: 'customer_name', label: t('settings.marketing.giftCards.tab.columns.customer'), type: 'string' },
    { field: 'is_active', label: t('settings.marketing.giftCards.tab.columns.status'), type: 'select', sortable: true },
    { field: 'expires_at', label: t('settings.marketing.giftCards.tab.columns.expires'), type: 'date', sortable: true }
  ],
  searchFields: ['code', 'customer_name'],
  actions: [
    { id: 'add', label: t('settings.marketing.giftCards.tab.actions.newGiftCard'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.marketing.giftCards.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'deactivate',
      label: t('settings.marketing.giftCards.tab.actions.deactivate'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.marketing.giftCards.tab.actions.confirmDeactivate')
    },
    {
      id: 'delete',
      label: t('settings.marketing.giftCards.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.marketing.giftCards.tab.actions.confirmDelete')
    }
  ]
})

const GiftCardsTab = () => {
  const t = useTranslations('admin')
  const giftCardsSchema = useMemo(() => buildGiftCardsSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<GiftCard[]>({
    fetchFn: async () => {
      const result = await getGiftCards()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<GiftCard | null>(null)

  const handleActionClick = async (action: SchemaAction, item: GiftCard | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as GiftCard)
      setEditOpen(true)
      return
    }
    if (action.id === 'deactivate' && 'id' in item) {
      try {
        await deactivateGiftCard((item as GiftCard).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.marketing.giftCards.tab.errors.deactivateFailed', { error: err.message }))
      }
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteGiftCard((item as GiftCard).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.marketing.giftCards.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: GiftCardPayload) => {
    try {
      if (selected) {
        await updateGiftCard(selected.id, payload)
      } else {
        await createGiftCard(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.marketing.giftCards.tab.errors.saveFailed', { error: err.message }))
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
        schema={giftCardsSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getGiftCard(typeof id === 'string' ? parseInt(id) : id)}
      />
      <GiftCardEditDialog
        open={editOpen}
        giftCard={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default GiftCardsTab
