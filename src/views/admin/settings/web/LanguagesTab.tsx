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
import LanguageEditDialog from './LanguageEditDialog'
import {
  getLanguages,
  getLanguage,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  type Language,
  type LanguagePayload
} from '@/services/web'

const buildLanguagesSchema = (t: any): ListSchema => ({
  title: t('settings.web.languages.tab.title'),
  columns: [
    { field: 'code', label: t('settings.web.languages.tab.columns.code'), type: 'string', sortable: true, link: 'edit' },
    { field: 'name', label: t('settings.web.languages.tab.columns.name'), type: 'string', sortable: true },
    { field: 'native_name', label: t('settings.web.languages.tab.columns.nativeName'), type: 'string' },
    { field: 'is_default', label: t('settings.web.languages.tab.columns.isDefault'), type: 'select', sortable: true },
    { field: 'is_active', label: t('settings.web.languages.tab.columns.status'), type: 'select', sortable: true },
    { field: 'order', label: t('settings.web.languages.tab.columns.order'), type: 'number', sortable: true }
  ],
  searchFields: ['code', 'name', 'native_name'],
  actions: [
    { id: 'add', label: t('settings.web.languages.tab.actions.newLanguage'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.web.languages.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.web.languages.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.web.languages.tab.actions.confirmDelete')
    }
  ]
})

const LanguagesTab = () => {
  const t = useTranslations('admin')
  const languagesSchema = useMemo(() => buildLanguagesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Language[]>({
    fetchFn: async () => {
      const result = await getLanguages()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Language | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Language | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Language)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteLanguage((item as Language).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.web.languages.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: LanguagePayload) => {
    try {
      if (selected) {
        await updateLanguage(selected.id, payload)
      } else {
        await createLanguage(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.languages.tab.errors.saveFailed', { error: err.message }))
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
        schema={languagesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getLanguage(typeof id === 'string' ? parseInt(id) : id)}
      />
      <LanguageEditDialog
        open={editOpen}
        language={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default LanguagesTab
