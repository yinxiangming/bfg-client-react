'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import SchemaForm from '@/components/schema/SchemaForm'
import CategoryRulesEditor from '@/components/category/CategoryRulesEditor'
import type { FormSchema } from '@/types/schema'
import type { CampaignDisplay, CampaignDisplayPayload, CategoryRule } from '@/services/marketing'
import { bfgApi } from '@/utils/api'

type CampaignDisplayEditDialogProps = {
  open: boolean
  display: CampaignDisplay | null
  onClose: () => void
  onSave: (data: CampaignDisplayPayload) => Promise<void> | void
}

const DISPLAY_TYPES = [
  { value: 'slide', labelKey: 'slide' },
  { value: 'category_entry', labelKey: 'categoryEntry' },
  { value: 'featured', labelKey: 'featured' }
] as const

const buildFormSchema = (t: (key: string) => string): FormSchema => ({
  title: t('settings.marketing.campaignDisplays.editDialog.title'),
  fields: [
    {
      field: 'title',
      label: t('settings.marketing.campaignDisplays.editDialog.fields.title'),
      type: 'string',
      fullWidth: true,
      helperText: t('settings.marketing.campaignDisplays.editDialog.fields.titleHelp')
    },
    {
      field: 'subtitle',
      label: t('settings.marketing.campaignDisplays.editDialog.fields.subtitle'),
      type: 'string',
      fullWidth: true,
      newline: true,
      helperText: t('settings.marketing.campaignDisplays.editDialog.fields.subtitleHelp')
    },
    {
      field: 'campaign',
      label: t('settings.marketing.campaignDisplays.editDialog.fields.campaign'),
      type: 'select',
      required: false,
      optionsSource: 'api',
      optionsApi: bfgApi.campaigns(),
      optionLabelTemplate: '{{name}}',
      searchable: true,
      searchParam: 'search',
      helperText: t('settings.marketing.campaignDisplays.editDialog.fields.campaignHelp')
    },
    {
      field: 'display_type',
      label: t('settings.marketing.campaignDisplays.editDialog.fields.displayType'),
      type: 'select',
      required: true,
      options: DISPLAY_TYPES.map(({ value, labelKey }) => ({
        value,
        label: t(`settings.marketing.campaignDisplays.editDialog.displayTypeOptions.${labelKey}`)
      }))
    },
    { field: 'order', label: t('settings.marketing.campaignDisplays.editDialog.fields.order'), type: 'number', defaultValue: 0 },
    {
      field: 'image',
      label: t('settings.marketing.campaignDisplays.editDialog.fields.image'),
      type: 'image',
      helperText: t('settings.marketing.campaignDisplays.editDialog.fields.imageHelp')
    },
    { field: 'link_url', label: t('settings.marketing.campaignDisplays.editDialog.fields.linkUrl'), type: 'string' },
    {
      field: 'link_target',
      label: t('settings.marketing.campaignDisplays.editDialog.fields.linkTarget'),
      type: 'select',
      options: [
        { value: '_self', label: '_self' },
        { value: '_blank', label: '_blank' }
      ]
    },
    {
      field: 'rules',
      label: t('settings.marketing.campaignDisplays.editDialog.fields.rules'),
      type: 'string',
      fullWidth: true,
      newline: true
    },
    {
      field: 'post',
      label: t('settings.marketing.campaignDisplays.editDialog.fields.post'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.posts(),
      optionLabelTemplate: '{{title}}',
      searchable: true
    },
    { field: 'is_active', label: t('settings.marketing.campaignDisplays.editDialog.fields.active'), type: 'boolean', defaultValue: true }
  ]
})

function parseRules(value: unknown): CategoryRule[] {
  if (Array.isArray(value)) return value as CategoryRule[]
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value.trim()) as unknown
    return Array.isArray(parsed) ? (parsed as CategoryRule[]) : []
  } catch {
    return []
  }
}

const CampaignDisplayEditDialog = ({ open, display, onClose, onSave }: CampaignDisplayEditDialogProps) => {
  const t = useTranslations('admin')
  const formSchema = useMemo(() => buildFormSchema(t), [t])

  const initialData: Record<string, unknown> = useMemo(() => {
    const base = display
      ? { ...display }
      : { display_type: 'slide' as const, order: 0, is_active: true }
    const rules = (display?.rules ?? []) as CategoryRule[]
    return {
      ...base,
      campaign: display?.campaign ?? null,
      title: display?.title ?? '',
      subtitle: display?.subtitle ?? '',
      rules: Array.isArray(rules) && rules.length > 0 ? JSON.stringify(rules, null, 2) : ''
    }
  }, [display])

  const handleSubmit = async (data: Record<string, unknown>) => {
    const payload: CampaignDisplayPayload = {
      campaign: data.campaign != null && data.campaign !== '' ? Number(data.campaign) : null,
      display_type: (data.display_type as CampaignDisplay['display_type']) || 'slide',
      order: Number(data.order ?? 0),
      title: (data.title as string) ?? '',
      subtitle: (data.subtitle as string) ?? '',
      image: data.image ?? null,
      link_url: (data.link_url as string) ?? '',
      link_target: (data.link_target as string) ?? '_self',
      rules: parseRules(data.rules),
      post: data.post != null && data.post !== '' ? Number(data.post) : null,
      is_active: Boolean(data.is_active)
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
        <SchemaForm
          schema={formSchema}
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          customFieldRenderer={(field, value, onChange, error) =>
            field.field === 'rules' ? (
              <CategoryRulesEditor
                value={value ?? ''}
                onChange={v => onChange(v)}
                error={error}
              />
            ) : null
          }
        />
      </DialogContent>
    </Dialog>
  )
}

export default CampaignDisplayEditDialog
