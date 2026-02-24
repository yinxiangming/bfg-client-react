'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Media, MediaPayload } from '@/services/web'

type MediaFormData = Omit<Media, 'file'> & {
  file?: File
}

type MediaEditDialogProps = {
  open: boolean
  media: Media | null
  onClose: () => void
  onSave: (data: MediaPayload) => Promise<void> | void
}

const MediaEditDialog = ({ open, media, onClose, onSave }: MediaEditDialogProps) => {
  const t = useTranslations('admin')
  const initialData: Partial<MediaFormData> = media
    ? (({ file: _file, ...rest }) => rest)(media as any)
    : {
        title: '',
        alt_text: '',
        caption: ''
      }

  // Define schema inside component to access media prop
  const mediaFormSchema: FormSchema = useMemo(
    () => ({
      title: t('settings.web.media.editDialog.title'),
      fields: [
        {
          field: 'file',
          label: t('settings.web.media.editDialog.fields.file'),
          type: 'file',
          required: !media,
          accept: 'image/*,video/*,.pdf,.doc,.docx'
        },
        { field: 'title', label: t('settings.web.media.editDialog.fields.title'), type: 'string' },
        {
          field: 'alt_text',
          label: t('settings.web.media.editDialog.fields.altText'),
          type: 'string',
          placeholder: t('settings.web.media.editDialog.placeholders.altText')
        },
        { field: 'caption', label: t('settings.web.media.editDialog.fields.caption'), type: 'textarea' }
      ]
    }),
    [t, media]
  )

  const handleSubmit = async (data: Partial<MediaFormData>) => {
    const payload: MediaPayload = {
      file: data.file,
      title: data.title,
      alt_text: data.alt_text,
      caption: data.caption
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
        <SchemaForm schema={mediaFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default MediaEditDialog

