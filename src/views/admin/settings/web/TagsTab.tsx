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
import TagEditDialog from './TagEditDialog'
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  type Tag,
  type TagPayload
} from '@/services/web'

const buildTagsSchema = (t: any): ListSchema => ({
  title: t('settings.web.tags.tab.title'),
  columns: [
    { field: 'name', label: t('settings.web.tags.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'slug', label: t('settings.web.tags.tab.columns.slug'), type: 'string', sortable: true },
    { field: 'language', label: t('settings.web.tags.tab.columns.language'), type: 'string' }
  ],
  searchFields: ['name', 'slug'],
  actions: [
    { id: 'add', label: t('settings.web.tags.tab.actions.newTag'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.web.tags.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.web.tags.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.web.tags.tab.actions.confirmDelete')
    }
  ]
})

const TagsTab = () => {
  const t = useTranslations('admin')
  const tagsSchema = useMemo(() => buildTagsSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Tag[]>({
    fetchFn: async () => {
      const result = await getTags()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Tag | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Tag | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Tag)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteTag((item as Tag).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.web.tags.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: TagPayload) => {
    try {
      if (selected) {
        await updateTag(selected.id, payload)
      } else {
        await createTag(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.tags.tab.errors.saveFailed', { error: err.message }))
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
        schema={tagsSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getTag(typeof id === 'string' ? parseInt(id) : id)}
      />
      <TagEditDialog
        open={editOpen}
        tag={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default TagsTab
