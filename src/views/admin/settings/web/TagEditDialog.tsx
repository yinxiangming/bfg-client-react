'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Tag, TagPayload } from '@/services/web'

type TagEditDialogProps = {
  open: boolean
  tag: Tag | null
  onClose: () => void
  onSave: (data: TagPayload) => Promise<void> | void
}

const buildTagFormSchema = (t: any): FormSchema => ({
  title: t('settings.web.tags.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.web.tags.editDialog.fields.name'), type: 'string', required: true },
    { field: 'slug', label: t('settings.web.tags.editDialog.fields.slug'), type: 'string', required: true },
    { field: 'language', label: t('settings.web.tags.editDialog.fields.language'), type: 'string', required: true, defaultValue: 'en' }
  ]
})

const TagEditDialog = ({ open, tag, onClose, onSave }: TagEditDialogProps) => {
  const t = useTranslations('admin')
  const tagFormSchema = useMemo(() => buildTagFormSchema(t), [t])

  const initialData: Partial<Tag> = tag
    ? tag
    : {
        name: '',
        slug: '',
        language: 'en'
      }

  const handleSubmit = async (data: Partial<Tag>) => {
    const payload: TagPayload = {
      name: data.name || '',
      slug: data.slug || '',
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
        <SchemaForm schema={tagFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default TagEditDialog

