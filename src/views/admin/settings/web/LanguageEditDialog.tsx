'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Language, LanguagePayload } from '@/services/web'

type LanguageEditDialogProps = {
  open: boolean
  language: Language | null
  onClose: () => void
  onSave: (data: LanguagePayload) => Promise<void> | void
}

const buildLanguageFormSchema = (t: any): FormSchema => ({
  title: t('settings.web.languages.editDialog.title'),
  fields: [
    {
      field: 'code',
      label: t('settings.web.languages.editDialog.fields.code'),
      type: 'string',
      required: true,
      placeholder: t('settings.web.languages.editDialog.placeholders.code')
    },
    {
      field: 'name',
      label: t('settings.web.languages.editDialog.fields.name'),
      type: 'string',
      required: true,
      placeholder: t('settings.web.languages.editDialog.placeholders.name')
    },
    {
      field: 'native_name',
      label: t('settings.web.languages.editDialog.fields.nativeName'),
      type: 'string',
      required: true,
      placeholder: t('settings.web.languages.editDialog.placeholders.nativeName')
    },
    { field: 'is_default', label: t('settings.web.languages.editDialog.fields.isDefault'), type: 'boolean', defaultValue: false },
    { field: 'is_active', label: t('settings.web.languages.editDialog.fields.active'), type: 'boolean', defaultValue: true },
    { field: 'is_rtl', label: t('settings.web.languages.editDialog.fields.rtl'), type: 'boolean', defaultValue: false },
    { field: 'order', label: t('settings.web.languages.editDialog.fields.order'), type: 'number', defaultValue: 100 }
  ]
})

const LanguageEditDialog = ({ open, language, onClose, onSave }: LanguageEditDialogProps) => {
  const t = useTranslations('admin')
  const languageFormSchema = useMemo(() => buildLanguageFormSchema(t), [t])

  const initialData: Partial<Language> = language
    ? language
    : {
        code: '',
        name: '',
        native_name: '',
        is_default: false,
        is_active: true,
        is_rtl: false,
        order: 100
      }

  const handleSubmit = async (data: Partial<Language>) => {
    const payload: LanguagePayload = {
      code: data.code || '',
      name: data.name || '',
      native_name: data.native_name || '',
      is_default: Boolean(data.is_default),
      is_active: Boolean(data.is_active),
      is_rtl: Boolean(data.is_rtl),
      order: Number(data.order) || 100
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
        <SchemaForm schema={languageFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default LanguageEditDialog

