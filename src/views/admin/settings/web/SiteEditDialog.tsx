'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import type { Site, SitePayload } from '@/services/web'
import { bfgApi } from '@/utils/api'

type SiteEditDialogProps = {
  open: boolean
  site: Site | null
  onClose: () => void
  onSave: (data: SitePayload) => Promise<void> | void
}

const buildSiteFormSchema = (t: any): FormSchema => ({
  title: t('settings.web.sites.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.web.sites.editDialog.fields.name'), type: 'string', required: true },
    {
      field: 'domain',
      label: t('settings.web.sites.editDialog.fields.domain'),
      type: 'string',
      required: true,
      placeholder: t('settings.web.sites.editDialog.placeholders.domain')
    },
    {
      field: 'theme_id',
      label: t('settings.web.sites.editDialog.fields.theme'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.themes(),
      optionLabelTemplate: '{{name}}',
      searchable: true,
      searchParam: 'q'
    },
    {
      field: 'default_language',
      label: t('settings.web.sites.editDialog.fields.defaultLanguage'),
      type: 'string',
      required: true,
      defaultValue: 'en'
    },
    { field: 'languages', label: t('settings.web.sites.editDialog.fields.supportedLanguages'), type: 'multiselect', required: true },
    { field: 'site_title', label: t('settings.web.sites.editDialog.fields.siteTitle'), type: 'string' },
    { field: 'site_description', label: t('settings.web.sites.editDialog.fields.siteDescription'), type: 'textarea' },
    { field: 'is_active', label: t('settings.web.sites.editDialog.fields.active'), type: 'boolean', defaultValue: true, newline: true },
    { field: 'is_default', label: t('settings.web.sites.editDialog.fields.isDefault'), type: 'boolean', defaultValue: false }
  ]
})

const SiteEditDialog = ({ open, site, onClose, onSave }: SiteEditDialogProps) => {
  const t = useTranslations('admin')
  const siteFormSchema = useMemo(() => buildSiteFormSchema(t), [t])

  const initialData: Partial<Site> = site
    ? site
    : {
        name: '',
        domain: '',
        default_language: 'en',
        languages: ['en'],
        is_active: true,
        is_default: false
      }

  const handleSubmit = async (data: Partial<Site>) => {
    const payload: SitePayload = {
      name: data.name || '',
      domain: data.domain || '',
      theme_id: data.theme_id,
      default_language: data.default_language || 'en',
      languages: Array.isArray(data.languages) ? data.languages : [data.default_language || 'en'],
      site_title: data.site_title,
      site_description: data.site_description,
      is_active: Boolean(data.is_active),
      is_default: Boolean(data.is_default)
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
        <SchemaForm schema={siteFormSchema} initialData={initialData} onSubmit={handleSubmit} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  )
}

export default SiteEditDialog

