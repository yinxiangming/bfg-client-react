'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaTable from '@/components/schema/SchemaTable'
import SchemaForm from '@/components/schema/SchemaForm'
import type { ListSchema, FormSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { buildTicketCategoriesSchema } from '@/data/supportSchemas'
import {
  getTicketCategories,
  createTicketCategory,
  updateTicketCategory,
  deleteTicketCategory,
  type TicketCategory,
  type TicketCategoryPayload
} from '@/services/support'

const CategoriesTab = () => {
  const t = useTranslations('admin')
  const schema = useMemo(() => buildTicketCategoriesSchema(t), [t])
  const listSchema = schema.list as ListSchema
  const formSchema = schema.form as FormSchema

  const { data: items, loading, error, refetch } = useApiData<TicketCategory[]>({
    fetchFn: getTicketCategories
  })
  const [editItem, setEditItem] = useState<TicketCategory | Partial<TicketCategory> | null>(null)
  const [saving, setSaving] = useState(false)

  const handleActionClick = async (action: SchemaAction, item: TicketCategory | Record<string, never>) => {
    if (action.id === 'add') {
      setEditItem({ name: '', description: '', order: 100, is_active: true })
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setEditItem(item as TicketCategory)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteTicketCategory((item as TicketCategory).id)
        await refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        alert(t('settings.support.categoriesTab.errors.deleteFailed', { error: msg }))
      }
    }
  }

  const formInitialData = useMemo(() => {
    if (!editItem) return undefined
    const c = editItem as TicketCategory
    return {
      name: c.name ?? '',
      description: c.description ?? '',
      order: c.order ?? 100,
      is_active: c.is_active ?? true
    }
  }, [editItem])

  const handleSubmit = async (data: Record<string, unknown>) => {
    const payload: TicketCategoryPayload = {
      name: String(data.name ?? ''),
      description: data.description ? String(data.description) : '',
      order: Number(data.order) || 100,
      is_active: Boolean(data.is_active)
    }
    setSaving(true)
    try {
      if (editItem && 'id' in editItem) {
        await updateTicketCategory((editItem as TicketCategory).id, payload)
      } else {
        await createTicketCategory(payload)
      }
      await refetch()
      setEditItem(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(t('settings.support.categoriesTab.errors.saveFailed', { error: msg }))
    } finally {
      setSaving(false)
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
      <Box sx={{ p: 4 }}>
        <SchemaTable
          schema={listSchema}
          data={items ?? []}
          onActionClick={handleActionClick}
        />
      </Box>
      {editItem !== null && formSchema && (
        <Dialog open onClose={() => setEditItem(null)} maxWidth='sm' fullWidth>
          <DialogContent sx={{ p: 0, '& .MuiCard-root': { boxShadow: 'none' }, '& .MuiCardContent-root': { p: 4 } }}>
            <SchemaForm
              schema={formSchema}
              initialData={formInitialData}
              onSubmit={handleSubmit}
              onCancel={() => setEditItem(null)}
              loading={saving}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default CategoriesTab
