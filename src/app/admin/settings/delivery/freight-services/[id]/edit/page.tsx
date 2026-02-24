'use client'

import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import Add from '@mui/icons-material/Add'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema, FormField } from '@/types/schema'
import { bfgApi } from '@/utils/api'
import { useApiData } from '@/hooks/useApiData'
import {
  getFreightService,
  updateFreightService,
  getFreightTemplates,
  updateFreightServiceConfig,
  type FreightService,
  type FreightServicePayload,
  type FreightTemplate,
  type FreightTemplateFormField
} from '@/services/delivery'

const buildFreightServiceFormSchema = (t: (key: string) => string): FormSchema => ({
  title: t('settings.delivery.freightServices.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.delivery.freightServices.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.delivery.freightServices.editDialog.fields.code'), type: 'string', required: true },
    {
      field: 'carrier',
      label: t('settings.delivery.freightServices.editDialog.fields.carrier'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.carriers(),
      optionLabelTemplate: '{{name}} ({{code}})',
      searchable: true,
      searchParam: 'q',
      required: true
    },
    { field: 'description', label: t('settings.delivery.freightServices.editDialog.fields.description'), type: 'textarea' },
    { field: 'base_price', label: t('settings.delivery.freightServices.editDialog.fields.basePrice'), type: 'number', required: true },
    { field: 'price_per_kg', label: t('settings.delivery.freightServices.editDialog.fields.pricePerKg'), type: 'number', required: true },
    { field: 'estimated_days_min', label: t('settings.delivery.freightServices.editDialog.fields.etaMinDays'), type: 'number', required: true },
    { field: 'estimated_days_max', label: t('settings.delivery.freightServices.editDialog.fields.etaMaxDays'), type: 'number', required: true },
    { field: 'order', label: t('settings.delivery.freightServices.editDialog.fields.order'), type: 'number', defaultValue: 100 },
    { field: 'is_active', label: t('settings.delivery.freightServices.editDialog.fields.active'), type: 'boolean', defaultValue: true, newline: true }
  ]
})

/** Map template form_schema to FormSchema (locale-aware label). */
function templateToFormSchema(template: FreightTemplate, locale: string): FormSchema {
  const isZh = locale === 'zh' || locale.startsWith('zh-')
  const fields: FormField[] = (template.form_schema || []).map((f: FreightTemplateFormField) => ({
    field: f.field,
    label: isZh && f.label_zh ? f.label_zh : f.label,
    type: (f.type === 'array' ? 'string' : f.type === 'number' ? 'number' : f.type === 'textarea' ? 'textarea' : 'string') as FormField['type'],
    required: f.required,
    defaultValue: f.defaultValue,
    helperText: f.helperText,
    placeholder: f.placeholder,
    ...(f.rows != null && { rows: f.rows })
  }))
  return { title: template.label, fields }
}

/** Infer template id from existing config for edit prefill; returns null if unknown. */
function inferTemplateFromConfig(config: Record<string, unknown> | undefined): string | null {
  if (!config || typeof config !== 'object') return null
  const mode = config.mode as string
  const rules = (config.rules || {}) as Record<string, unknown>
  const pricingRules = (config.pricing_rules || []) as unknown[]
  if (mode === 'linear') {
    if (rules.fixed_price != null) return 'flat_rate'
    if (rules.base != null && rules.per_kg != null) return 'base_plus_per_kg'
    if (rules.first_cbm != null && rules.first_cbm_price != null) return 'first_cbm_then_per_cbm'
  }
  if (mode === 'step' && rules.first_weight != null && rules.first_price != null) return 'first_kg_then_per_kg'
  if (mode === 'tier' && Array.isArray(rules.tiers) && rules.tiers.length > 0) return 'weight_tiers'
  if (mode === 'conditional' && Array.isArray(pricingRules) && pricingRules.length >= 2) {
    const first = pricingRules[0] as Record<string, unknown>
    const conds = (first.conditions || []) as Record<string, unknown>[]
    if (conds.some((c: Record<string, unknown>) => c.type === 'order_amount_gte')) return 'free_over_amount'
    if (conds.some((c: Record<string, unknown>) => c.type === 'weight_gte')) return 'free_over_weight'
  }
  return null
}

/** Build initial form data for a template from existing config (for edit prefill). */
function configToTemplateParams(config: Record<string, unknown> | undefined, templateId: string): Record<string, unknown> {
  if (!config) return {}
  const rules = (config.rules || {}) as Record<string, unknown>
  const pricingRules = (config.pricing_rules || []) as Record<string, unknown>[]
  switch (templateId) {
    case 'flat_rate':
      return { amount: rules.fixed_price ?? '', currency: config.currency ?? '' }
    case 'base_plus_per_kg':
      return { base: rules.base ?? '', per_kg: rules.per_kg ?? '', currency: config.currency ?? '' }
    case 'first_kg_then_per_kg':
      return {
        first_weight: rules.first_weight ?? '',
        first_price: rules.first_price ?? '',
        additional_weight: rules.additional_weight ?? 1,
        additional_price: rules.additional_price ?? '',
        currency: config.currency ?? ''
      }
    case 'weight_tiers':
      return { tiers: rules.tiers ?? [], currency: config.currency ?? '' }
    case 'free_over_amount': {
      const cond = (pricingRules[0] as Record<string, unknown>)?.conditions as Record<string, unknown>[] | undefined
      const threshold = cond?.find((c: Record<string, unknown>) => c.type === 'order_amount_gte')?.value
      const fallback = (pricingRules[1] as Record<string, unknown>)?.pricing as Record<string, unknown> | undefined
      return {
        threshold_amount: threshold ?? '',
        fallback_base: fallback?.base ?? '',
        fallback_per_kg: fallback?.per_kg ?? '',
        currency: config.currency ?? ''
      }
    }
    case 'free_over_weight': {
      const cond = (pricingRules[0] as Record<string, unknown>)?.conditions as Record<string, unknown>[] | undefined
      const threshold = cond?.find((c: Record<string, unknown>) => c.type === 'weight_gte')?.value
      const fallback = (pricingRules[1] as Record<string, unknown>)?.pricing as Record<string, unknown> | undefined
      return {
        threshold_kg: threshold ?? '',
        fallback_base: fallback?.base ?? '',
        fallback_per_kg: fallback?.per_kg ?? '',
        currency: config.currency ?? ''
      }
    }
    case 'first_cbm_then_per_cbm':
      return {
        first_cbm: rules.first_cbm ?? '',
        first_cbm_price: rules.first_cbm_price ?? '',
        additional_cbm_price: rules.additional_cbm_price ?? '',
        max_weight_kg: rules.max_weight_kg ?? '',
        volumetric_factor: rules.volumetric_factor ?? 5000,
        currency: config.currency ?? ''
      }
    default:
      return {}
  }
}

export default function FreightServiceEditPage() {
  const router = useRouter()
  const params = useParams()
  const t = useTranslations('admin')
  const locale = useLocale()
  const id = params?.id ? Number(params.id) : null

  const [tabIndex, setTabIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [configJsonModalOpen, setConfigJsonModalOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  const { data: service, loading, error, refetch } = useApiData<FreightService>({
    fetchFn: () => getFreightService(id!),
    enabled: id != null && !Number.isNaN(id)
  })

  const { data: templates, loading: templatesLoading } = useApiData<FreightTemplate[]>({
    fetchFn: getFreightTemplates,
    enabled: tabIndex === 1
  })

  const infoSchema = useMemo(() => buildFreightServiceFormSchema(t), [t])

  const inferredTemplateId = useMemo(
    () => inferTemplateFromConfig(service?.config as Record<string, unknown> | undefined),
    [service?.config]
  )
  const effectiveTemplateId = selectedTemplateId ?? inferredTemplateId
  const selectedTemplate = useMemo(
    () => (templates || []).find((x) => x.id === effectiveTemplateId) ?? null,
    [templates, effectiveTemplateId]
  )
  const templateFormSchema = useMemo(
    () => (selectedTemplate ? templateToFormSchema(selectedTemplate, locale) : null),
    [selectedTemplate, locale]
  )
  const templateFormInitialData = useMemo(() => {
    if (!effectiveTemplateId) return undefined
    const fromConfig = service?.config
      ? configToTemplateParams(service.config as Record<string, unknown>, effectiveTemplateId)
      : {}
    const hasAny = Object.keys(fromConfig).length > 0 && Object.values(fromConfig).some((v) => v !== '' && v !== undefined)
    if (hasAny) return fromConfig
    if (!selectedTemplate?.form_schema) return undefined
    const fromDefaults: Record<string, unknown> = {}
    selectedTemplate.form_schema.forEach((f: FreightTemplateFormField) => {
      if (f.defaultValue !== undefined) fromDefaults[f.field] = f.defaultValue
    })
    return Object.keys(fromDefaults).length ? fromDefaults : undefined
  }, [effectiveTemplateId, service?.config, selectedTemplate?.form_schema])

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!id) return
    setSaving(true)
    try {
      const payload: Partial<FreightServicePayload> = {
        name: String(data.name ?? ''),
        code: String(data.code ?? ''),
        carrier: Number(data.carrier),
        description: data.description ? String(data.description) : undefined,
        base_price: Number(data.base_price ?? 0),
        price_per_kg: Number(data.price_per_kg ?? 0),
        estimated_days_min: Number(data.estimated_days_min ?? 1),
        estimated_days_max: Number(data.estimated_days_max ?? 7),
        order: Number(data.order ?? 100),
        is_active: Boolean(data.is_active ?? true)
      }
      await updateFreightService(id, payload)
      setSnackbar({ open: true, message: t('settings.delivery.freightServices.tab.updated'), severity: 'success' })
      await refetch()
    } catch (err: unknown) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed to save', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleConfigSubmit = async (data: Record<string, unknown>) => {
    if (!id || !effectiveTemplateId) return
    setSavingConfig(true)
    try {
      await updateFreightServiceConfig(id, effectiveTemplateId, data)
      setSnackbar({ open: true, message: t('settings.delivery.freightServices.tab.configUpdated'), severity: 'success' })
      await refetch()
    } catch (err: unknown) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed to save config', severity: 'error' })
    } finally {
      setSavingConfig(false)
    }
  }

  const handleCancel = () => router.push('/admin/settings/delivery')

  if (id == null || Number.isNaN(id)) {
    return (
      <Box>
        <Alert severity="error">{t('settings.delivery.freightServices.tab.invalidId')}</Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !service) {
    return (
      <Box>
        <Alert severity="error">{error ?? 'Not found'}</Alert>
      </Box>
    )
  }

  const initialInfoData: Record<string, unknown> = {
    name: service.name,
    code: service.code,
    carrier: service.carrier,
    description: service.description,
    base_price: service.base_price,
    price_per_kg: service.price_per_kg,
    estimated_days_min: service.estimated_days_min,
    estimated_days_max: service.estimated_days_max,
    order: service.order,
    is_active: service.is_active
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        {t('settings.delivery.freightServices.editDialog.title')} — {service.name}
      </Typography>
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label={t('settings.delivery.freightServices.tab.tabs.info')} />
        <Tab label={t('settings.delivery.freightServices.tab.tabs.config')} />
      </Tabs>
      {tabIndex === 0 && (
        <Card>
          <CardContent>
            <SchemaForm
              schema={infoSchema}
              initialData={initialInfoData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={saving}
            />
          </CardContent>
        </Card>
      )}
      {tabIndex === 1 && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              {t('settings.delivery.freightServices.tab.configTab.descriptionTitle')}
            </Typography>
            <Typography variant="body2" component="span" color="text.secondary">
              {t('settings.delivery.freightServices.tab.configTab.descriptionBody')}
            </Typography>
          </Alert>
          {templatesLoading && !templates?.length ? (
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </CardContent>
            </Card>
          ) : (
            <>
              {!inferredTemplateId && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {t('settings.delivery.freightServices.tab.configTab.selectTemplatePrompt')}
                </Alert>
              )}
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setTemplateModalOpen(true)}
                >
                  {effectiveTemplateId && selectedTemplate
                    ? (locale === 'zh' || locale.startsWith('zh-') && selectedTemplate.label_zh ? selectedTemplate.label_zh : selectedTemplate.label)
                    : t('settings.delivery.freightServices.tab.configTab.chooseTemplate')}
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setConfigJsonModalOpen(true)}
                >
                  {t('settings.delivery.freightServices.tab.configTab.viewConfigJson')}
                </Button>
              </Box>
              <Dialog open={configJsonModalOpen} onClose={() => setConfigJsonModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{t('settings.delivery.freightServices.tab.configTab.viewConfigJson')}</DialogTitle>
                <DialogContent dividers>
                  <TextField
                    fullWidth
                    multiline
                    minRows={12}
                    maxRows={24}
                    value={service?.config != null ? JSON.stringify(service.config, null, 2) : '{}'}
                    InputProps={{ readOnly: true }}
                    sx={{ fontFamily: 'monospace', '& textarea': { fontFamily: 'monospace', fontSize: '0.875rem' } }}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} maxWidth="sm" fullWidth>
                  <DialogTitle>{t('settings.delivery.freightServices.tab.configTab.chooseTemplate')}</DialogTitle>
                  <DialogContent dividers>
                    <List sx={{ py: 0 }}>
                      {(templates || []).map((tmpl) => {
                        const isZh = locale === 'zh' || locale.startsWith('zh-')
                        const name = isZh && tmpl.label_zh ? tmpl.label_zh : tmpl.label
                        const desc = isZh && tmpl.description_zh ? tmpl.description_zh : (tmpl.description || '')
                        const selected = effectiveTemplateId === tmpl.id
                        return (
                          <ListItemButton
                            key={tmpl.id}
                            selected={selected}
                            onClick={() => {
                              setSelectedTemplateId(tmpl.id)
                              setTemplateModalOpen(false)
                            }}
                          >
                            <ListItemText
                              primary={name}
                              secondary={desc}
                              primaryTypographyProps={{ fontWeight: selected ? 600 : 400 }}
                            />
                          </ListItemButton>
                        )
                      })}
                    </List>
                  </DialogContent>
                </Dialog>
              {templateFormSchema && selectedTemplate && (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                      <Button
                        type="button"
                        variant="contained"
                        disabled={savingConfig}
                        onClick={() => document.getElementById('freight-config-form')?.requestSubmit()}
                      >
                        {savingConfig ? t('common.schemaForm.saving') : t('common.schemaForm.save')}
                      </Button>
                    </Box>
                    <SchemaForm
                      formId="freight-config-form"
                      schema={{ ...templateFormSchema, title: t('settings.delivery.freightServices.tab.tabs.config') }}
                      initialData={templateFormInitialData}
                      onSubmit={handleConfigSubmit}
                      onCancel={() => {}}
                      loading={savingConfig}
                      customFieldRenderer={(field, value, onChange, fieldError) => {
                        if (field.field !== 'tiers') return null
                        const rows = Array.isArray(value) ? value : (value && typeof value === 'object') ? [value] : []
                        const list: { max_kg: number; price: number }[] = rows.length
                          ? rows.map((r: unknown) => ({
                              max_kg: Number((r as { max_kg?: number })?.max_kg) || 0,
                              price: Number((r as { price?: number })?.price) || 0
                            }))
                          : [{ max_kg: 0, price: 0 }]
                        const update = (next: { max_kg: number; price: number }[]) => onChange(next)
                        return (
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{field.helperText}</Typography>
                            {list.map((row, idx) => (
                              <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                                <TextField
                                  type="number"
                                  size="small"
                                  label="Max kg"
                                  value={row.max_kg}
                                  onChange={(e) => {
                                    const v = Number(e.target.value) || 0
                                    const next = list.map((r, i) => (i === idx ? { ...r, max_kg: v } : r))
                                    update(next)
                                  }}
                                  sx={{ width: 120 }}
                                />
                                <TextField
                                  type="number"
                                  size="small"
                                  label="Price"
                                  value={row.price}
                                  onChange={(e) => {
                                    const v = Number(e.target.value) || 0
                                    const next = list.map((r, i) => (i === idx ? { ...r, price: v } : r))
                                    update(next)
                                  }}
                                  sx={{ width: 120 }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => update(list.filter((_, i) => i !== idx))}
                                  disabled={list.length <= 1}
                                  aria-label="Remove row"
                                >
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                            <Button
                              type="button"
                              size="small"
                              startIcon={<Add />}
                              onClick={() => update([...list, { max_kg: 0, price: 0 }])}
                            >
                              {t('settings.delivery.freightServices.tab.configTab.addTier')}
                            </Button>
                            {fieldError && <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>{fieldError}</Typography>}
                          </Box>
                        )
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
