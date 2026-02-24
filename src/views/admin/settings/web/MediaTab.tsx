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
import MediaEditDialog from './MediaEditDialog'
import {
  getMedia,
  getMediaItem,
  uploadMedia,
  updateMedia,
  deleteMedia,
  type Media,
  type MediaPayload
} from '@/services/web'

const buildMediaSchema = (t: any): ListSchema => ({
  title: t('settings.web.media.tab.title'),
  columns: [
    { field: 'file_name', label: t('settings.web.media.tab.columns.fileName'), type: 'string', sortable: true, link: 'edit' },
    { field: 'file', label: t('settings.web.media.tab.columns.preview'), type: 'image' },
    { field: 'file_type', label: t('settings.web.media.tab.columns.fileType'), type: 'select', sortable: true },
    { field: 'file_size', label: t('settings.web.media.tab.columns.fileSize'), type: 'string' },
    { field: 'title', label: t('settings.web.media.tab.columns.title'), type: 'string' },
    { field: 'uploaded_at', label: t('settings.web.media.tab.columns.uploadedAt'), type: 'date', sortable: true }
  ],
  searchFields: ['file_name', 'title'],
  actions: [
    { id: 'add', label: t('settings.web.media.tab.actions.uploadMedia'), type: 'primary', scope: 'global', icon: 'tabler-upload' },
    { id: 'edit', label: t('settings.web.media.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.web.media.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.web.media.tab.actions.confirmDelete')
    }
  ]
})

const MediaTab = () => {
  const t = useTranslations('admin')
  const mediaSchema = useMemo(() => buildMediaSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Media[]>({
    fetchFn: async () => {
      const result = await getMedia()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Media | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Media | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Media)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteMedia((item as Media).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.web.media.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: MediaPayload) => {
    try {
      if (selected) {
        await updateMedia(selected.id, payload)
      } else {
        await uploadMedia(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.media.tab.errors.saveFailed', { error: err.message }))
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
        schema={mediaSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getMediaItem(typeof id === 'string' ? parseInt(id) : id)}
      />
      <MediaEditDialog
        open={editOpen}
        media={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default MediaTab
