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
import MessageTemplateEditDialog from './MessageTemplateEditDialog'
import {
  getMessageTemplates,
  getMessageTemplate,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  type MessageTemplate,
  type MessageTemplatePayload
} from '@/services/messageTemplate'

const buildMessageTemplatesSchema = (t: any): ListSchema => ({
  title: t('settings.store.messageTemplates.tab.title'),
  columns: [
    { field: 'name', label: t('settings.store.messageTemplates.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.store.messageTemplates.tab.columns.code'), type: 'string', sortable: true },
    { field: 'event', label: t('settings.store.messageTemplates.tab.columns.event'), type: 'string', sortable: true },
    { field: 'language', label: t('settings.store.messageTemplates.tab.columns.language'), type: 'string', sortable: true },
    {
      field: 'email_enabled',
      label: t('settings.store.messageTemplates.tab.columns.email'),
      type: 'select',
      render: (value) => (value ? t('settings.store.messageTemplates.tab.values.yes') : t('settings.store.messageTemplates.tab.values.no'))
    },
    {
      field: 'sms_enabled',
      label: t('settings.store.messageTemplates.tab.columns.sms'),
      type: 'select',
      render: (value) => (value ? t('settings.store.messageTemplates.tab.values.yes') : t('settings.store.messageTemplates.tab.values.no'))
    },
    {
      field: 'push_enabled',
      label: t('settings.store.messageTemplates.tab.columns.push'),
      type: 'select',
      render: (value) => (value ? t('settings.store.messageTemplates.tab.values.yes') : t('settings.store.messageTemplates.tab.values.no'))
    },
    { field: 'is_active', label: t('settings.store.messageTemplates.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code', 'event'],
  actions: [
    { id: 'add', label: t('settings.store.messageTemplates.tab.actions.newTemplate'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.store.messageTemplates.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.store.messageTemplates.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.store.messageTemplates.tab.actions.confirmDelete')
    }
  ]
})

const MessageTemplatesTab = () => {
  const t = useTranslations('admin')
  const messageTemplatesSchema = useMemo(() => buildMessageTemplatesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<MessageTemplate[]>({
    fetchFn: async () => {
      const result = await getMessageTemplates()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<MessageTemplate | null>(null)

  const handleActionClick = async (action: SchemaAction, item: MessageTemplate | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as MessageTemplate)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteMessageTemplate((item as MessageTemplate).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.store.messageTemplates.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: MessageTemplatePayload) => {
    try {
      if (selected) {
        await updateMessageTemplate(selected.id, payload)
      } else {
        await createMessageTemplate(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.store.messageTemplates.tab.errors.saveFailed', { error: err.message }))
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
        schema={messageTemplatesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getMessageTemplate(typeof id === 'string' ? parseInt(id) : id)}
      />
      <MessageTemplateEditDialog
        open={editOpen}
        template={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default MessageTemplatesTab
