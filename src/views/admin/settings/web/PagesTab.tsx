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
import PageEditDialog from './PageEditDialog'
import {
  getPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  type Page,
  type PagePayload
} from '@/services/web'

const buildPagesSchema = (t: any): ListSchema => ({
  title: t('settings.web.pages.tab.title'),
  columns: [
    { field: 'title', label: t('settings.web.pages.tab.columns.title'), type: 'string', sortable: true, link: 'edit' },
    { field: 'slug', label: t('settings.web.pages.tab.columns.slug'), type: 'string', sortable: true },
    { field: 'status', label: t('settings.web.pages.tab.columns.status'), type: 'select', sortable: true },
    { field: 'language', label: t('settings.web.pages.tab.columns.language'), type: 'string' },
    { field: 'order', label: t('settings.web.pages.tab.columns.order'), type: 'number', sortable: true },
    { field: 'is_featured', label: t('settings.web.pages.tab.columns.featured'), type: 'select', sortable: true },
    { field: 'published_at', label: t('settings.web.pages.tab.columns.publishedAt'), type: 'date', sortable: true }
  ],
  searchFields: ['title', 'slug'],
  actions: [
    { id: 'add', label: t('settings.web.pages.tab.actions.newPage'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.web.pages.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.web.pages.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.web.pages.tab.actions.confirmDelete')
    }
  ]
})

const PagesTab = () => {
  const t = useTranslations('admin')
  const pagesSchema = useMemo(() => buildPagesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Page[]>({
    fetchFn: async () => {
      const result = await getPages()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Page | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Page | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Page)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deletePage((item as Page).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.web.pages.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: PagePayload) => {
    try {
      if (selected) {
        await updatePage(selected.id, payload)
      } else {
        await createPage(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.pages.tab.errors.saveFailed', { error: err.message }))
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
        schema={pagesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getPage(typeof id === 'string' ? parseInt(id) : id)}
      />
      <PageEditDialog
        open={editOpen}
        page={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
        onBlocksSaved={refetch}
      />
    </>
  )
}

export default PagesTab
