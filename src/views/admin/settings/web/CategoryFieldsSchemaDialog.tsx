'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import CustomTextField from '@/components/ui/TextField'
import { useAppDialog } from '@/contexts/AppDialogContext'
import {
  getCategorySchemaTemplate,
  getCategoryTemplateSummaries,
  type Category,
  type CategoryFieldSchemaEntry,
  type CategoryFieldsSchema,
  type CategoryTemplateSummary
} from '@/services/web'

const FIELD_TYPES = ['string', 'text', 'integer', 'number', 'boolean', 'select', 'image'] as const
type FieldType = (typeof FIELD_TYPES)[number]

type OptionRow = { oid: string; label: string; value: string; label_en: string }

type FieldRow = {
  rid: string
  fieldKey: string
  type: FieldType
  label: string
  labelZh: string
  description: string
  required: boolean
  defaultValue: string
  options: OptionRow[]
}

function newRowId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}-${Math.random()}`
}

function schemaToRows(schema: CategoryFieldsSchema | undefined | null): FieldRow[] {
  if (!schema || typeof schema !== 'object') return []
  return Object.entries(schema).map(([fieldKey, def]) => {
    const d = def as CategoryFieldSchemaEntry
    const t = (d.type as FieldType) || 'string'
    const type: FieldType = FIELD_TYPES.includes(t as FieldType) ? t : 'string'
    let defaultValue = ''
    if (d.default !== undefined && d.default !== null) {
      defaultValue = String(d.default)
    }
    const options: OptionRow[] = Array.isArray(d.options)
      ? d.options.map(o => ({
          oid: newRowId(),
          label: typeof o.label === 'string' ? o.label : '',
          value: o.value != null ? String(o.value) : '',
          label_en: typeof o.label_en === 'string' ? o.label_en : ''
        }))
      : []
    return {
      rid: newRowId(),
      fieldKey,
      type,
      label: d.label || '',
      labelZh: d.label_zh || '',
      description: d.description || '',
      required: Boolean(d.required),
      defaultValue,
      options
    }
  })
}

function rowsToSchema(rows: FieldRow[]): CategoryFieldsSchema {
  const out: CategoryFieldsSchema = {}
  for (const r of rows) {
    const k = r.fieldKey.trim()
    if (!k) continue
    const entry: CategoryFieldSchemaEntry = {
      type: r.type,
      required: r.required || undefined,
      label: r.label.trim() || undefined,
      label_zh: r.labelZh.trim() || undefined,
      description: r.description.trim() || undefined
    }
    if (r.defaultValue.trim() !== '') {
      if (r.type === 'integer') {
        const n = parseInt(r.defaultValue, 10)
        if (!Number.isNaN(n)) entry.default = n
      } else if (r.type === 'number') {
        const n = parseFloat(r.defaultValue)
        if (!Number.isNaN(n)) entry.default = n
      } else if (r.type === 'boolean') {
        entry.default = r.defaultValue === 'true'
      } else {
        entry.default = r.defaultValue
      }
    }
    if (r.type === 'select') {
      const opts = r.options.filter(o => o.value.trim()).map(o => ({
        label: o.label.trim() || o.value.trim(),
        value: o.value.trim(),
        ...(o.label_en.trim() ? { label_en: o.label_en.trim() } : {})
      }))
      if (opts.length > 0) entry.options = opts
    }
    out[k] = entry
  }
  return out
}

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/i

type CategoryFieldsSchemaDialogProps = {
  open: boolean
  category: Category | null
  onClose: () => void
  onSave: (schema: CategoryFieldsSchema) => Promise<void> | void
}

export default function CategoryFieldsSchemaDialog({ open, category, onClose, onSave }: CategoryFieldsSchemaDialogProps) {
  const t = useTranslations('admin')
  const { confirm } = useAppDialog()
  const [rows, setRows] = useState<FieldRow[]>([])
  const [templates, setTemplates] = useState<CategoryTemplateSummary[]>([])
  const [templateKey, setTemplateKey] = useState('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredTemplates = useMemo(() => {
    const ct = (category?.content_type_name || '').trim().toLowerCase()
    if (!ct) return templates
    const match = templates.filter(x => (x.content_type_name || '').toLowerCase() === ct)
    return match.length > 0 ? match : templates
  }, [templates, category?.content_type_name])

  useEffect(() => {
    if (!open || !category) return
    setRows(schemaToRows(category.fields_schema))
    setTemplateKey('')
    setError(null)
  }, [open, category])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      setLoadingTemplates(true)
      try {
        const list = await getCategoryTemplateSummaries()
        if (!cancelled) setTemplates(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setTemplates([])
      } finally {
        if (!cancelled) setLoadingTemplates(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const addField = useCallback(() => {
    setRows(prev => [
      ...prev,
      {
        rid: newRowId(),
        fieldKey: '',
        type: 'string',
        label: '',
        labelZh: '',
        description: '',
        required: false,
        defaultValue: '',
        options: []
      }
    ])
  }, [])

  const removeRow = useCallback((rid: string) => {
    setRows(prev => prev.filter(r => r.rid !== rid))
  }, [])

  const updateRow = useCallback((rid: string, patch: Partial<FieldRow>) => {
    setRows(prev => prev.map(r => (r.rid === rid ? { ...r, ...patch } : r)))
  }, [])

  const moveRow = useCallback((rid: string, dir: -1 | 1) => {
    setRows(prev => {
      const i = prev.findIndex(r => r.rid === rid)
      if (i < 0) return prev
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [])

  const addOption = useCallback((rid: string) => {
    setRows(prev =>
      prev.map(r =>
        r.rid === rid
          ? { ...r, options: [...r.options, { oid: newRowId(), label: '', value: '', label_en: '' }] }
          : r
      )
    )
  }, [])

  const updateOption = useCallback((fieldRid: string, oid: string, patch: Partial<OptionRow>) => {
    setRows(prev =>
      prev.map(r =>
        r.rid === fieldRid
          ? { ...r, options: r.options.map(o => (o.oid === oid ? { ...o, ...patch } : o)) }
          : r
      )
    )
  }, [])

  const removeOption = useCallback((fieldRid: string, oid: string) => {
    setRows(prev =>
      prev.map(r => (r.rid === fieldRid ? { ...r, options: r.options.filter(o => o.oid !== oid) } : r))
    )
  }, [])

  const applyTemplate = async (key: string) => {
    if (!key) return
    if (
      rows.length > 0 &&
      !(await confirm(t('settings.web.categories.fieldsSchemaDialog.confirmReplaceTemplate'), { danger: true }))
    ) {
      setTemplateKey('')
      return
    }
    try {
      const detail = await getCategorySchemaTemplate(key)
      setRows(schemaToRows(detail.fields_schema))
      setTemplateKey('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('settings.web.categories.fieldsSchemaDialog.loadTemplateFailed'))
    }
  }

  const validate = (): string | null => {
    const keys = new Set<string>()
    for (const r of rows) {
      const k = r.fieldKey.trim()
      if (!k) return t('settings.web.categories.fieldsSchemaDialog.validation.emptyKey')
      if (!KEY_PATTERN.test(k)) return t('settings.web.categories.fieldsSchemaDialog.validation.invalidKey', { key: k })
      if (keys.has(k)) return t('settings.web.categories.fieldsSchemaDialog.validation.duplicateKey', { key: k })
      keys.add(k)
      if (r.type === 'select') {
        const validOpts = r.options.filter(o => o.value.trim())
        if (validOpts.length === 0) return t('settings.web.categories.fieldsSchemaDialog.validation.selectNeedsOptions', { key: k })
      }
    }
    return null
  }

  const handleSave = async () => {
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave(rowsToSchema(rows))
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('settings.web.categories.fieldsSchemaDialog.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (!category) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='paper'>
      <DialogTitle>
        {t('settings.web.categories.fieldsSchemaDialog.title', { name: category.name })}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          {t('settings.web.categories.fieldsSchemaDialog.intro')}
        </Typography>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }} alignItems='center'>
          <Grid size={{ xs: 12, sm: 8 }}>
            <FormControl fullWidth size='small' disabled={loadingTemplates}>
              <InputLabel>{t('settings.web.categories.fieldsSchemaDialog.applyTemplate')}</InputLabel>
              <Select
                label={t('settings.web.categories.fieldsSchemaDialog.applyTemplate')}
                value={templateKey}
                onChange={e => setTemplateKey(e.target.value as string)}
              >
                <MenuItem value=''>
                  <em>{t('settings.web.categories.fieldsSchemaDialog.templatePlaceholder')}</em>
                </MenuItem>
                {filteredTemplates.map(tp => (
                  <MenuItem key={tp.key} value={tp.key}>
                    {tp.name} ({tp.content_type_name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              variant='outlined'
              fullWidth
              disabled={!templateKey || loadingTemplates}
              onClick={() => applyTemplate(templateKey)}
            >
              {t('settings.web.categories.fieldsSchemaDialog.loadTemplate')}
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='subtitle2' fontWeight={600}>
            {t('settings.web.categories.fieldsSchemaDialog.fieldsHeading')}
          </Typography>
          <Button size='small' variant='contained' startIcon={<i className='tabler-plus' />} onClick={addField}>
            {t('settings.web.categories.fieldsSchemaDialog.addField')}
          </Button>
        </Box>

        {rows.length === 0 ? (
          <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
            {t('settings.web.categories.fieldsSchemaDialog.noFields')}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rows.map((r, idx) => (
              <Paper key={r.rid} variant='outlined' sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    {t('settings.web.categories.fieldsSchemaDialog.fieldNumber', { n: idx + 1 })}
                  </Typography>
                  <Box>
                    <Tooltip title={t('settings.web.categories.fieldsSchemaDialog.moveUp')}>
                      <span>
                        <IconButton size='small' disabled={idx === 0} onClick={() => moveRow(r.rid, -1)}>
                          <i className='tabler-chevron-up' />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t('settings.web.categories.fieldsSchemaDialog.moveDown')}>
                      <span>
                        <IconButton size='small' disabled={idx === rows.length - 1} onClick={() => moveRow(r.rid, 1)}>
                          <i className='tabler-chevron-down' />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t('common.actions.delete')}>
                      <IconButton size='small' color='error' onClick={() => removeRow(r.rid)}>
                        <i className='tabler-trash' />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      size='small'
                      required
                      label={t('settings.web.categories.fieldsSchemaDialog.fieldKey')}
                      value={r.fieldKey}
                      onChange={e => updateRow(r.rid, { fieldKey: e.target.value })}
                      placeholder='client_name'
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>{t('settings.web.categories.fieldsSchemaDialog.fieldType')}</InputLabel>
                      <Select
                        label={t('settings.web.categories.fieldsSchemaDialog.fieldType')}
                        value={r.type}
                        onChange={e => updateRow(r.rid, { type: e.target.value as FieldType })}
                      >
                        {FIELD_TYPES.map(ft => (
                          <MenuItem key={ft} value={ft}>
                            {ft}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      size='small'
                      label={t('settings.web.categories.fieldsSchemaDialog.label')}
                      value={r.label}
                      onChange={e => updateRow(r.rid, { label: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      size='small'
                      label={t('settings.web.categories.fieldsSchemaDialog.labelZh')}
                      value={r.labelZh}
                      onChange={e => updateRow(r.rid, { labelZh: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <CustomTextField
                      fullWidth
                      size='small'
                      multiline
                      minRows={2}
                      label={t('settings.web.categories.fieldsSchemaDialog.description')}
                      value={r.description}
                      onChange={e => updateRow(r.rid, { description: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <CustomTextField
                      fullWidth
                      size='small'
                      label={t('settings.web.categories.fieldsSchemaDialog.defaultValue')}
                      value={r.defaultValue}
                      onChange={e => updateRow(r.rid, { defaultValue: e.target.value })}
                      helperText={t('settings.web.categories.fieldsSchemaDialog.defaultValueHint')}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch checked={r.required} onChange={e => updateRow(r.rid, { required: e.target.checked })} />
                      }
                      label={t('settings.web.categories.fieldsSchemaDialog.required')}
                    />
                  </Grid>

                  {r.type === 'select' && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 1 }}>
                        {t('settings.web.categories.fieldsSchemaDialog.optionsHeading')}
                      </Typography>
                      {r.options.map(opt => (
                        <Grid container spacing={1} key={opt.oid} sx={{ mb: 1 }} alignItems='center'>
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <CustomTextField
                              fullWidth
                              size='small'
                              label={t('settings.web.categories.fieldsSchemaDialog.optionLabel')}
                              value={opt.label}
                              onChange={e => updateOption(r.rid, opt.oid, { label: e.target.value })}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <CustomTextField
                              fullWidth
                              size='small'
                              label={t('settings.web.categories.fieldsSchemaDialog.optionValue')}
                              value={opt.value}
                              onChange={e => updateOption(r.rid, opt.oid, { value: e.target.value })}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <CustomTextField
                              fullWidth
                              size='small'
                              label={t('settings.web.categories.fieldsSchemaDialog.optionLabelEn')}
                              value={opt.label_en}
                              onChange={e => updateOption(r.rid, opt.oid, { label_en: e.target.value })}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 2 }}>
                            <IconButton color='error' onClick={() => removeOption(r.rid, opt.oid)} size='small'>
                              <i className='tabler-x' />
                            </IconButton>
                          </Grid>
                        </Grid>
                      ))}
                      <Button size='small' onClick={() => addOption(r.rid)}>
                        {t('settings.web.categories.fieldsSchemaDialog.addOption')}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {t('common.actions.cancel')}
        </Button>
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {saving ? t('common.states.saving') : t('common.actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
