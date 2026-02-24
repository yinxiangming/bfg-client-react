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
import PostEditDialog from './PostEditDialog'
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  type Post,
  type PostPayload
} from '@/services/web'

const buildPostsSchema = (t: any): ListSchema => ({
  title: t('settings.web.posts.tab.title'),
  columns: [
    { field: 'title', label: t('settings.web.posts.tab.columns.title'), type: 'string', sortable: true, link: 'edit' },
    { field: 'slug', label: t('settings.web.posts.tab.columns.slug'), type: 'string', sortable: true },
    { field: 'category_name', label: t('settings.web.posts.tab.columns.category'), type: 'string' },
    { field: 'status', label: t('settings.web.posts.tab.columns.status'), type: 'select', sortable: true },
    { field: 'language', label: t('settings.web.posts.tab.columns.language'), type: 'string' },
    { field: 'view_count', label: t('settings.web.posts.tab.columns.views'), type: 'number', sortable: true },
    { field: 'published_at', label: t('settings.web.posts.tab.columns.publishedAt'), type: 'date', sortable: true }
  ],
  searchFields: ['title', 'slug'],
  actions: [
    { id: 'add', label: t('settings.web.posts.tab.actions.newPost'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.web.posts.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.web.posts.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.web.posts.tab.actions.confirmDelete')
    }
  ]
})

const PostsTab = () => {
  const t = useTranslations('admin')
  const postsSchema = useMemo(() => buildPostsSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Post[]>({
    fetchFn: async () => {
      const result = await getPosts()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Post | null>(null)

  const handleActionClick = async (action: SchemaAction, item: Post | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as Post)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deletePost((item as Post).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.web.posts.tab.errors.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: PostPayload) => {
    try {
      if (selected) {
        await updatePost(selected.id, payload)
      } else {
        await createPost(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.web.posts.tab.errors.saveFailed', { error: err.message }))
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
        schema={postsSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getPost(typeof id === 'string' ? parseInt(id) : id)}
      />
      <PostEditDialog
        open={editOpen}
        post={selected}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default PostsTab
