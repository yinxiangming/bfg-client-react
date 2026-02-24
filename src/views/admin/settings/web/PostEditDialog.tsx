'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Post, PostPayload } from '@/services/web'
import { bfgApi } from '@/utils/api'

type PostFormData = Omit<PostPayload, 'featured_image'> & {
  featured_image?: File
}

type PostEditDialogProps = {
  open: boolean
  post: Post | null
  onClose: () => void
  onSave: (data: PostPayload) => Promise<void> | void
}

const buildPostFormSchema = (t: any): FormSchema => ({
  title: t('settings.web.posts.editDialog.title'),
  fields: [
    { field: 'title', label: t('settings.web.posts.editDialog.fields.title'), type: 'string', required: true },
    { field: 'slug', label: t('settings.web.posts.editDialog.fields.slug'), type: 'string', required: true },
    { field: 'content', label: t('settings.web.posts.editDialog.fields.content'), type: 'textarea', required: true, rows: 10 },
    { field: 'excerpt', label: t('settings.web.posts.editDialog.fields.excerpt'), type: 'textarea', rows: 3 },
    { field: 'featured_image', label: t('settings.web.posts.editDialog.fields.featuredImage'), type: 'file', accept: 'image/*' },
    {
      field: 'category_id',
      label: t('settings.web.posts.editDialog.fields.category'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: `${bfgApi.categories()}?content_type=post`,
      optionLabelTemplate: '{{name}}',
      searchable: true,
      searchParam: 'q'
    },
    {
      field: 'tag_ids',
      label: t('settings.web.posts.editDialog.fields.tags'),
      type: 'multiselect',
      optionsSource: 'api',
      optionsApi: bfgApi.tags(),
      optionLabelTemplate: '{{name}}',
      searchable: true,
      searchParam: 'q'
    },
    { field: 'meta_title', label: t('settings.web.posts.editDialog.fields.seoTitle'), type: 'string' },
    { field: 'meta_description', label: t('settings.web.posts.editDialog.fields.seoDescription'), type: 'textarea', rows: 3 },
    {
      field: 'status',
      label: t('settings.web.posts.editDialog.fields.status'),
      type: 'select',
      required: true,
      options: [
        { value: 'draft', label: t('settings.web.posts.editDialog.statusOptions.draft') },
        { value: 'published', label: t('settings.web.posts.editDialog.statusOptions.published') },
        { value: 'archived', label: t('settings.web.posts.editDialog.statusOptions.archived') }
      ],
      defaultValue: 'draft'
    },
    { field: 'published_at', label: t('settings.web.posts.editDialog.fields.publishedAt'), type: 'datetime' },
    { field: 'allow_comments', label: t('settings.web.posts.editDialog.fields.allowComments'), type: 'boolean', defaultValue: true },
    { field: 'language', label: t('settings.web.posts.editDialog.fields.language'), type: 'string', required: true, defaultValue: 'en' }
  ]
})

const PostEditDialog = ({ open, post, onClose, onSave }: PostEditDialogProps) => {
  const t = useTranslations('admin')
  const postFormSchema = useMemo(() => buildPostFormSchema(t), [t])

  const initialData: Partial<PostFormData> = post
    ? (({ featured_image: _featuredImage, ...rest }) => rest)(post as any)
    : {
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        allow_comments: true,
        language: 'en'
      }

  const handleSubmit = async (data: Partial<PostFormData>) => {
    const payload: PostPayload = {
      title: data.title || '',
      slug: data.slug || '',
      content: data.content || '',
      excerpt: data.excerpt,
      featured_image: data.featured_image,
      category_id: data.category_id,
      tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : [],
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      status: (data.status as 'draft' | 'published' | 'archived') || 'draft',
      published_at: data.published_at,
      allow_comments: Boolean(data.allow_comments),
      language: data.language || 'en'
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm schema={postFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default PostEditDialog

