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
import { buildTicketPrioritiesSchema } from '@/data/supportSchemas'
import {
  getTicketPriorities,
  createTicketPriority,
  updateTicketPriority,
  deleteTicketPriority,
  type TicketPriority,
  type TicketPriorityPayload
} from '@/services/support'

const PrioritiesTab = () => {
  const t = useTranslations('admin')
  const schema = useMemo(() => buildTicketPrioritiesSchema(t), [t])
  const listSchema = schema.list as ListSchema
  const formSchema = schema.form as FormSchema

  const { data: items, loading, error, refetch } = useApiData<TicketPriority[]>({
    fetchFn: getTicketPriorities
  })
  const [editItem, setEditItem] = useState<TicketPriority | Partial<TicketPriority> | null>(null)
  const [saving, setSaving] = useState(false)

  const handleActionClick = async (action: SchemaAction, item: TicketPriority | Record<string, never>) => {
    if (action.id === 'add') {
      setEditItem({ name: '', level: 1, is_active: true })
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setEditItem(item as TicketPriority)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteTicketPriority((item as TicketPriority).id)
        await refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        alert(t('settings.support.prioritiesTab.errors.deleteFailed', { error: msg }))
      }
    }
  }

  const formInitialData = useMemo(() => {
    if (!editItem) return undefined
    const p = editItem as TicketPriority
    return {
      name: p.name ?? '',
      level: p.level ?? 1,
      color: p.color ?? '',
      response_time_hours: p.response_time_hours ?? undefined,
      resolution_time_hours: p.resolution_time_hours ?? undefined,
      is_active: p.is_active ?? true
    }
  }, [editItem])

  const handleSubmit = async (data: Record<string, unknown>) => {
    const payload: TicketPriorityPayload = {
      name: String(data.name ?? ''),
      level: Number(data.level) || 1,
      color: data.color ? String(data.color) : '',
      response_time_hours: data.response_time_hours != null && data.response_time_hours !== '' ? Number(data.response_time_hours) : null,
      resolution_time_hours: data.resolution_time_hours != null && data.resolution_time_hours !== '' ? Number(data.resolution_time_hours) : null,
      is_active: Boolean(data.is_active)
    }
    setSaving(true)
    try {
      if (editItem && 'id' in editItem) {
        await updateTicketPriority((editItem as TicketPriority).id, payload)
      } else {
        await createTicketPriority(payload)
      }
      await refetch()
      setEditItem(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(t('settings.support.prioritiesTab.errors.saveFailed', { error: msg }))
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

export default PrioritiesTab
