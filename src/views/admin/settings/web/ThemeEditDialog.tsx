'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Theme, ThemePayload } from '@/services/web'

type ThemeFormData = Omit<ThemePayload, 'logo' | 'favicon'> & {
  logo?: File
  favicon?: File
}

type ThemeEditDialogProps = {
  open: boolean
  theme: Theme | null
  onClose: () => void
  onSave: (data: ThemePayload) => Promise<void> | void
}

const buildThemeFormSchema = (t: any): FormSchema => ({
  title: t('settings.web.themes.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.web.themes.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.web.themes.editDialog.fields.code'), type: 'string', required: true },
    { field: 'description', label: t('settings.web.themes.editDialog.fields.description'), type: 'textarea' },
    { field: 'template_path', label: t('settings.web.themes.editDialog.fields.templatePath'), type: 'string' },
    { field: 'logo', label: t('settings.web.themes.editDialog.fields.logo'), type: 'file', accept: 'image/*' },
    { field: 'favicon', label: t('settings.web.themes.editDialog.fields.favicon'), type: 'file', accept: 'image/*' },
    { field: 'primary_color', label: t('settings.web.themes.editDialog.fields.primaryColor'), type: 'color', defaultValue: '#007bff' },
    { field: 'secondary_color', label: t('settings.web.themes.editDialog.fields.secondaryColor'), type: 'color', defaultValue: '#6c757d' },
    { field: 'custom_css', label: t('settings.web.themes.editDialog.fields.customCss'), type: 'textarea', rows: 6 },
    { field: 'custom_js', label: t('settings.web.themes.editDialog.fields.customJs'), type: 'textarea', rows: 6 },
    { field: 'is_active', label: t('settings.web.themes.editDialog.fields.active'), type: 'boolean', defaultValue: true, newline: true }
  ]
})

const ThemeEditDialog = ({ open, theme, onClose, onSave }: ThemeEditDialogProps) => {
  const t = useTranslations('admin')
  const themeFormSchema = useMemo(() => buildThemeFormSchema(t), [t])

  const initialData: Partial<ThemeFormData> = theme
    ? (({ logo: _logo, favicon: _favicon, ...rest }) => rest)(theme as any)
    : {
        name: '',
        code: '',
        primary_color: '#007bff',
        secondary_color: '#6c757d',
        is_active: true
      }

  const handleSubmit = async (data: Partial<ThemeFormData>) => {
    const payload: ThemePayload = {
      name: data.name || '',
      code: data.code || '',
      description: data.description,
      template_path: data.template_path,
      logo: data.logo,
      favicon: data.favicon,
      primary_color: data.primary_color || '#007bff',
      secondary_color: data.secondary_color || '#6c757d',
      custom_css: data.custom_css,
      custom_js: data.custom_js,
      config: data.config,
      is_active: Boolean(data.is_active)
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogContent
        sx={{
          p: 0,
          '& .MuiCard-root': { boxShadow: 'none' },
          '& .MuiCardContent-root': { p: 4 }
        }}
      >
        <SchemaForm schema={themeFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default ThemeEditDialog

