'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { CategoryFieldSchemaEntry, CategoryFieldsSchema } from '@/services/web'

type PostCustomFieldsBlockProps = {
  schema: CategoryFieldsSchema | null | undefined
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  disabled?: boolean
}

function resolveLabel(entry: CategoryFieldSchemaEntry, locale: string): string {
  if (locale.startsWith('zh') && entry.label_zh) return entry.label_zh
  return entry.label || ''
}

function resolveOptionLabel(
  opt: { label: string; label_en?: string },
  locale: string
): string {
  if (locale.startsWith('en') && opt.label_en) return opt.label_en
  return opt.label
}

/** MUI default required asterisk uses primary text color; match SchemaForm (error). */
const requiredAsteriskSx = {
  '& .MuiInputLabel-asterisk': { color: 'error.main' }
} as const

export default function PostCustomFieldsBlock({
  schema,
  value,
  onChange,
  disabled = false
}: PostCustomFieldsBlockProps) {
  const t = useTranslations('admin')
  const locale = useLocale()

  const entries = useMemo(() => {
    if (!schema || typeof schema !== 'object') return []
    return Object.entries(schema).sort(([a], [b]) => a.localeCompare(b))
  }, [schema])

  const setVal = (key: string, v: unknown) => {
    onChange({ ...value, [key]: v })
  }

  if (entries.length === 0) return null

  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 0,
        isolation: 'isolate',
        mt: 2,
        mb: 1
      }}
    >
      <Divider sx={{ my: 2 }} />
      <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 1 }}>
        {t('settings.web.posts.editDialog.customFieldsSection')}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 0 }}>
            {t('settings.web.posts.editDialog.customFieldsHint')}
          </Typography>
        </Grid>
        {entries.map(([key, def]) => {
          const label = resolveLabel(def, locale) || key
          const helper = def.description
          const raw = value[key]
          const typ = def.type || 'string'

          if (typ === 'boolean') {
            const checked = raw === true || raw === 'true'
            return (
              <Grid key={key} size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={checked}
                      onChange={e => setVal(key, e.target.checked)}
                      disabled={disabled}
                    />
                  }
                  label={
                    <>
                      {label}
                      {def.required ? (
                        <Typography component='span' sx={{ color: 'error.main', ml: 0.25 }} aria-hidden>
                          *
                        </Typography>
                      ) : null}
                    </>
                  }
                />
                {helper ? (
                  <Typography variant='caption' color='text.secondary' display='block'>
                    {helper}
                  </Typography>
                ) : null}
              </Grid>
            )
          }

          if (typ === 'select' && Array.isArray(def.options) && def.options.length > 0) {
            const strVal = raw !== undefined && raw !== null ? String(raw) : ''
            return (
              <Grid key={key} size={{ xs: 12, md: 6 }}>
                <FormControl
                  fullWidth
                  size='small'
                  required={def.required}
                  disabled={disabled}
                  sx={def.required ? requiredAsteriskSx : undefined}
                >
                  <InputLabel>{label}</InputLabel>
                  <Select
                    label={label}
                    value={strVal}
                    onChange={e => setVal(key, e.target.value)}
                  >
                    {!def.required ? (
                      <MenuItem value=''>
                        <em>{t('settings.web.posts.editDialog.customFieldSelectEmpty')}</em>
                      </MenuItem>
                    ) : null}
                    {def.options.map(opt => (
                      <MenuItem key={String(opt.value)} value={String(opt.value)}>
                        {resolveOptionLabel(opt, locale)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {helper ? <Typography variant='caption' color='text.secondary'>{helper}</Typography> : null}
              </Grid>
            )
          }

          if (typ === 'text') {
            return (
              <Grid key={key} size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  size='small'
                  label={label}
                  value={raw !== undefined && raw !== null ? String(raw) : ''}
                  onChange={e => setVal(key, e.target.value)}
                  required={def.required}
                  helperText={helper}
                  disabled={disabled}
                  sx={def.required ? requiredAsteriskSx : undefined}
                />
              </Grid>
            )
          }

          if (typ === 'integer' || typ === 'number') {
            return (
              <Grid key={key} size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type='number'
                  size='small'
                  label={label}
                  value={raw !== undefined && raw !== null ? String(raw) : ''}
                  onChange={e => {
                    const s = e.target.value
                    if (s === '') {
                      setVal(key, '')
                      return
                    }
                    setVal(key, typ === 'integer' ? parseInt(s, 10) : parseFloat(s))
                  }}
                  required={def.required}
                  helperText={helper}
                  disabled={disabled}
                  inputProps={typ === 'integer' ? { step: 1 } : undefined}
                  sx={def.required ? requiredAsteriskSx : undefined}
                />
              </Grid>
            )
          }

          if (typ === 'image') {
            return (
              <Grid key={key} size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size='small'
                  label={label}
                  value={raw !== undefined && raw !== null ? String(raw) : ''}
                  onChange={e => setVal(key, e.target.value)}
                  required={def.required}
                  helperText={helper || t('settings.web.posts.editDialog.customFieldImageHint')}
                  disabled={disabled}
                  placeholder={t('settings.web.posts.editDialog.customFieldImagePlaceholder')}
                  sx={def.required ? requiredAsteriskSx : undefined}
                />
              </Grid>
            )
          }

          return (
            <Grid key={key} size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size='small'
                label={label}
                value={raw !== undefined && raw !== null ? String(raw) : ''}
                onChange={e => setVal(key, e.target.value)}
                required={def.required}
                helperText={helper}
                disabled={disabled}
                sx={def.required ? requiredAsteriskSx : undefined}
              />
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
