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
import ThemeEditDialog from './ThemeEditDialog'
import {
  getThemes,
  getTheme,
  createTheme,
  updateTheme,
  deleteTheme,
  type Theme,
  type ThemePayload
} from '@/services/web'

const buildThemesSchema = (t: any): ListSchema => ({
  title: t('settings.web.themes.tab.title'),
  columns: [
    { field: 'name', label: t('settings.web.themes.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.web.themes.tab.columns.code'), type: 'string', sortable: true },
    { field: 'primary_color', label: t('settings.web.themes.tab.columns.primaryColor'), type: 'string' },
    { field: 'is_active', label: t('settings.web.themes.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code'],
  actions: [
    { id: 'add', label: t('settings.web.themes.tab.actions.newTheme'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.web.themes.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.web.themes.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.web.themes.tab.actions.confirmDelete')
    }
  ]
})

const ThemesTab = () => {
  const t = useTranslations('admin')
  const themesSchema = useMemo(() => buildThemesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Theme[]>({
    fetchFn: async () => {
      const result = await getThemes()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Theme | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Theme | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Theme)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteTheme((item as Theme).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.web.themes.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: ThemePayload) => {
    try {
      if (selected) {
        await updateTheme(selected.id, payload)
      } else {
        await createTheme(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.themes.tab.errors.saveFailed', { error: err.message }))
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
        schema={themesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getTheme(typeof id === 'string' ? parseInt(id) : id)}
      />
      <ThemeEditDialog
        open={editOpen}
        theme={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default ThemesTab
