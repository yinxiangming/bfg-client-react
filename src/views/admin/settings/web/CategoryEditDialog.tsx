'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Category, CategoryPayload } from '@/services/web'
import { bfgApi } from '@/utils/api'

type CategoryEditDialogProps = {
  open: boolean
  category: Category | null
  onClose: () => void
  onSave: (data: CategoryPayload) => Promise<void> | void
}

const buildCategoryFormSchema = (t: any): FormSchema => ({
  title: t('settings.web.categories.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.web.categories.editDialog.fields.name'), type: 'string', required: true },
    { field: 'slug', label: t('settings.web.categories.editDialog.fields.slug'), type: 'string', required: true },
    { field: 'description', label: t('settings.web.categories.editDialog.fields.description'), type: 'textarea' },
    {
      field: 'parent_id',
      label: t('settings.web.categories.editDialog.fields.parentCategory'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.categories(),
      optionLabelTemplate: '{{name}}',
      searchable: true,
      searchParam: 'q'
    },
    {
      field: 'content_type_name',
      label: t('settings.web.categories.editDialog.fields.contentType'),
      type: 'select',
      options: [
        { value: '', label: t('settings.web.categories.editDialog.contentTypeOptions.generic') },
        { value: 'post', label: t('settings.web.categories.editDialog.contentTypeOptions.post') },
        { value: 'project', label: t('settings.web.categories.editDialog.contentTypeOptions.project') },
        { value: 'service', label: t('settings.web.categories.editDialog.contentTypeOptions.service') },
        { value: 'faq', label: t('settings.web.categories.editDialog.contentTypeOptions.faq') }
      ]
    },
    {
      field: 'icon',
      label: t('settings.web.categories.editDialog.fields.icon'),
      type: 'string',
      placeholder: t('settings.web.categories.editDialog.placeholders.icon')
    },
    { field: 'color', label: t('settings.web.categories.editDialog.fields.color'), type: 'color' },
    { field: 'order', label: t('settings.web.categories.editDialog.fields.order'), type: 'number', defaultValue: 100 },
    { field: 'is_active', label: t('settings.web.categories.editDialog.fields.active'), type: 'boolean', defaultValue: true },
    { field: 'language', label: t('settings.web.categories.editDialog.fields.language'), type: 'string', required: true, defaultValue: 'en' }
  ]
})

const CategoryEditDialog = ({ open, category, onClose, onSave }: CategoryEditDialogProps) => {
  const t = useTranslations('admin')
  const categoryFormSchema = useMemo(() => buildCategoryFormSchema(t), [t])

  const initialData: Partial<Category> = category
    ? category
    : {
        name: '',
        slug: '',
        content_type_name: '',
        order: 100,
        is_active: true,
        language: 'en'
      }

  const handleSubmit = async (data: Partial<Category>) => {
    const payload: CategoryPayload = {
      name: data.name || '',
      slug: data.slug || '',
      description: data.description,
      parent_id: data.parent_id,
      content_type_name: data.content_type_name || '',
      icon: data.icon,
      color: data.color,
      order: Number(data.order) || 100,
      is_active: Boolean(data.is_active),
      language: data.language || 'en'
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm schema={categoryFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default CategoryEditDialog

