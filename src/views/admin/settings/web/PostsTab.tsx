'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { getPosts, getCategories, deletePost, type Post, type Category } from '@/services/web'

const buildPostsSchema = (
  t: (key: string) => string,
  categoryOptions: Array<{ value: number; label: string }>
): ListSchema => ({
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
  filters: [
    {
      field: 'language',
      label: t('settings.web.posts.tab.filters.language'),
      type: 'select',
      options: [
        { value: 'en', label: t('settings.web.posts.editDialog.languageOptions.en') },
        { value: 'zh-hans', label: t('settings.web.posts.editDialog.languageOptions.zhHans') }
      ]
    },
    {
      field: 'status',
      label: t('settings.web.posts.tab.filters.status'),
      type: 'select',
      options: [
        { value: 'draft', label: t('settings.web.posts.editDialog.statusOptions.draft') },
        { value: 'published', label: t('settings.web.posts.editDialog.statusOptions.published') },
        { value: 'archived', label: t('settings.web.posts.editDialog.statusOptions.archived') }
      ]
    },
    {
      field: 'category_id',
      label: t('settings.web.posts.tab.filters.category'),
      type: 'select',
      options: categoryOptions.map(o => ({ value: o.value, label: o.label }))
    }
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
  const router = useRouter()

  const { data: categories } = useApiData<Category[]>({
    fetchFn: () => getCategories('post')
  })

  const categoryFilterOptions = useMemo(
    () => (categories ?? []).map(c => ({ value: c.id, label: c.name })),
    [categories]
  )

  const postsSchema = useMemo(() => buildPostsSchema(t, categoryFilterOptions), [t, categoryFilterOptions])

  const { data, loading, error, refetch } = useApiData<Post[]>({
    fetchFn: () => getPosts()
  })
  const handleActionClick = async (action: SchemaAction, item: Post | {}) => {
    if (action.id === 'add') {
      router.push('/admin/settings/web/posts/new')
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      router.push(`/admin/settings/web/posts/${(item as Post).id}/edit`)
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
    <SchemaTable schema={postsSchema} data={data || []} onActionClick={handleActionClick} />
  )
}

export default PostsTab
