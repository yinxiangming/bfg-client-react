'use client'

/**
 * Create a workspace owned by the signed-in user, switch to it and open its setup wizard.
 * Only the name is asked for up front. Country, currency and language wait under "more
 * settings", and any left alone is copied by the server from the current workspace.
 * Choosing a country also chooses its currency and language, except any the user has picked.
 */

import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'

import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import CustomTextField from '@/components/ui/TextField'
import { createTenantWorkspace, getTenantWorkspaceErrorMessage, type TenantWorkspace } from '@/services/platform'
import { switchWorkspace, WorkspaceSwitchError } from '@/utils/switchWorkspace'

/** The currencies the server has a profile for. It refuses any other. */
const CURRENCY_CODES = [
  'AED', 'AUD', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'HKD', 'IDR', 'INR',
  'JPY', 'KRW', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'TWD', 'USD', 'VND'
] as const

/** The languages the server supports, labelled from the common namespace. */
const LANGUAGES = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'zh-hans', labelKey: 'language.zhHans' }
] as const

/**
 * The currency and default language the setup wizard's profile of a country gives it. Only a
 * value the lists above offer fits, as the server refuses any other: where a profile names
 * another, that field is left out, and choosing the country leaves the field as it is.
 */
type CountryPreset = {
  currency?: (typeof CURRENCY_CODES)[number]
  language?: (typeof LANGUAGES)[number]['code']
}

/**
 * The countries the setup wizard has defaults for, since the wizard is where a new workspace
 * goes next; the server itself takes any two-letter code. Their names are messages rather
 * than Intl.DisplayNames, so they read as they do in the wizard.
 */
const COUNTRY_PRESETS = {
  AE: { currency: 'AED', language: 'en' },
  AU: { currency: 'AUD', language: 'en' },
  CA: { currency: 'CAD', language: 'en' },
  CH: { currency: 'CHF', language: 'en' },
  CN: { currency: 'CNY', language: 'zh-hans' },
  DE: { currency: 'EUR', language: 'en' },
  ES: { currency: 'EUR', language: 'en' },
  FR: { currency: 'EUR', language: 'en' },
  GB: { currency: 'GBP', language: 'en' },
  HK: { currency: 'HKD', language: 'zh-hans' },
  ID: { currency: 'IDR', language: 'en' },
  IE: { currency: 'EUR', language: 'en' },
  IN: { currency: 'INR', language: 'en' },
  IT: { currency: 'EUR', language: 'en' },
  JP: { currency: 'JPY', language: 'en' },
  KR: { currency: 'KRW', language: 'en' },
  MY: { currency: 'MYR', language: 'en' },
  NL: { currency: 'EUR', language: 'en' },
  NZ: { currency: 'NZD', language: 'en' },
  PH: { currency: 'PHP', language: 'en' },
  SG: { currency: 'SGD', language: 'en' },
  TH: { currency: 'THB', language: 'en' },
  TW: { currency: 'TWD', language: 'zh-hans' },
  US: { currency: 'USD', language: 'en' },
  VN: { currency: 'VND', language: 'en' }
} satisfies Record<string, CountryPreset>

type CountryCode = keyof typeof COUNTRY_PRESETS

const COUNTRY_CODES = Object.keys(COUNTRY_PRESETS) as CountryCode[]

/** The server's max_length for a workspace name. */
const NAME_MAX_LENGTH = 255

const SIGN_IN_PATH = '/auth/login?redirect=/workspaces'

const SETTING_FIELDS = ['country', 'currency', 'language'] as const

type SettingField = (typeof SETTING_FIELDS)[number]

type Field = 'name' | SettingField

/** '' is "same as current shop": the setting stays out of the request. */
type Settings = Record<SettingField, string>

type Option = { value: string; label: string }

type FieldErrors = Partial<Record<Field, string>>

/** Creating the workspace, then switching the access token to it. */
type Phase = 'idle' | 'creating' | 'switching'

const SAME_AS_CURRENT: Settings = { country: '', currency: '', language: '' }

/** The settings that follow the country. */
const PRESET_FIELDS = ['currency', 'language'] as const

/** Which of them the user has picked since the dialog opened. */
type Picked = Record<(typeof PRESET_FIELDS)[number], boolean>

const NONE_PICKED: Picked = { currency: false, language: false }

/**
 * The settings once a country is chosen. A currency or language the user has not picked
 * follows the country: to its preset, or back to "same as current shop" along with it. One
 * the user has picked stays, and so does one the country's preset has no value for.
 */
function withCountry(settings: Settings, country: string, picked: Picked): Settings {
  const preset: CountryPreset | undefined = Object.hasOwn(COUNTRY_PRESETS, country)
    ? COUNTRY_PRESETS[country as CountryCode]
    : undefined
  const next = { ...settings, country }

  for (const field of PRESET_FIELDS) {
    if (picked[field]) continue
    const value = country ? preset?.[field] : ''
    if (value !== undefined) next[field] = value
  }

  return next
}

function errorStatus(error: unknown): number | undefined {
  return (error as { status?: number } | null)?.status
}

/** The server's first message for each field of this form, or null when it named none of them. */
function readFieldErrors(error: unknown): FieldErrors | null {
  if (errorStatus(error) !== 400) return null
  const body = (error as { validationErrors?: Record<string, unknown> }).validationErrors
  if (!body) return null

  const errors: FieldErrors = {}
  for (const field of ['name', ...SETTING_FIELDS] as const) {
    const value = body[field]
    const message = Array.isArray(value) ? value[0] : value
    if (typeof message === 'string' && message) errors[field] = message
  }

  return Object.keys(errors).length > 0 ? errors : null
}

type CreateWorkspaceDialogProps = {
  open: boolean
  onClose: () => void
  /** The server refused to create one, so what the page last heard from me/ is out of date. */
  onRefused: () => void
  /** The workspace was created, but the switch to it failed; it can be opened from its card. */
  onSwitchFailed: (workspace: TenantWorkspace) => void
}

export default function CreateWorkspaceDialog({ open, onClose, onRefused, onSwitchFailed }: CreateWorkspaceDialogProps) {
  const t = useTranslations('admin.workspaces.create')
  const tActions = useTranslations('admin.common.actions')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const moreId = useId()

  const [name, setName] = useState('')
  const [settings, setSettings] = useState<Settings>(SAME_AS_CURRENT)
  const [picked, setPicked] = useState<Picked>(NONE_PICKED)
  const [moreOpen, setMoreOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Every opening starts from a blank form.
  useEffect(() => {
    if (!open) return
    setName('')
    setSettings(SAME_AS_CURRENT)
    setPicked(NONE_PICKED)
    setMoreOpen(false)
    setPhase('idle')
    setFormError(null)
    setFieldErrors({})
  }, [open])

  const options = useMemo<Record<SettingField, Option[]>>(() => {
    let currencyNames: Intl.DisplayNames | null = null
    try {
      currencyNames = new Intl.DisplayNames([locale], { type: 'currency' })
    } catch {
      // Without display names, each currency shows as its code.
    }

    return {
      country: COUNTRY_CODES.map(code => ({ value: code, label: t(`countries.${code}`) })).sort((a, b) =>
        a.label.localeCompare(b.label, locale)
      ),
      currency: CURRENCY_CODES.map(code => {
        const currencyName = currencyNames?.of(code)
        return { value: code, label: currencyName && currencyName !== code ? `${code} — ${currencyName}` : code }
      }),
      language: LANGUAGES.map(({ code, labelKey }) => ({ value: code, label: tCommon(labelKey) }))
    }
  }, [locale, t, tCommon])

  const busy = phase !== 'idle'
  const trimmedName = name.trim()

  const clearFieldError = (field: Field) => {
    setFieldErrors(current => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const changeSetting = (field: SettingField, value: string) => {
    if (field !== 'country') {
      setSettings(current => ({ ...current, [field]: value }))
      setPicked(current => ({ ...current, [field]: true }))
      clearFieldError(field)
      return
    }

    const next = withCountry(settings, value, picked)
    setSettings(next)
    // An error is about the value its field held, so it goes when the country changes that value.
    for (const changed of SETTING_FIELDS) {
      if (next[changed] !== settings[changed]) clearFieldError(changed)
    }
  }

  const showCreateError = (error: unknown) => {
    // workspace_create_forbidden or workspace_limit_reached: nothing on the form can fix it.
    const refusal = getTenantWorkspaceErrorMessage(error)
    if (refusal) {
      setFormError(tCommon(refusal.key, refusal.values))
      onRefused()
      return
    }

    // apiFetch already tried a token refresh, and a failed one signs the user out.
    if (errorStatus(error) === 401) {
      router.replace(SIGN_IN_PATH)
      return
    }

    const errors = readFieldErrors(error)
    if (errors) {
      setFieldErrors(errors)
      // An error under a collapsed field would go unseen.
      if (SETTING_FIELDS.some(field => errors[field])) setMoreOpen(true)
      return
    }

    setFormError(t('failed'))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !trimmedName) return

    setPhase('creating')
    setFormError(null)
    setFieldErrors({})

    let workspace: TenantWorkspace
    try {
      // A setting left on "same as current shop" is not sent, and the server copies it from
      // the workspace the access token belongs to.
      workspace = await createTenantWorkspace({
        name: trimmedName,
        country: settings.country || undefined,
        currency: settings.currency || undefined,
        language: settings.language || undefined
      })
    } catch (error) {
      setPhase('idle')
      showCreateError(error)
      return
    }

    setPhase('switching')
    try {
      await switchWorkspace(workspace.id)
    } catch (error) {
      if (error instanceof WorkspaceSwitchError && error.status === 401) {
        // No refresh token, or the refresh failed and signed the user out.
        router.replace(SIGN_IN_PATH)
        return
      }
      onSwitchFailed(workspace)
      return
    }

    // A full page load, not router.push(): this tab still holds what it fetched and cached
    // with the previous workspace's token. The buttons stay disabled until the page unloads.
    window.location.assign('/admin/setup')
  }

  const submitLabel = phase === 'creating' ? t('creating') : phase === 'switching' ? t('switching') : t('submit')

  return (
    // While a request runs, neither the backdrop nor Escape closes the dialog.
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth='sm' fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {formError && <Alert severity='error'>{formError}</Alert>}

          <Typography variant='body2' color='text.secondary'>
            {t('description')}
          </Typography>

          <CustomTextField
            autoFocus
            required
            fullWidth
            label={t('fields.name')}
            value={name}
            onChange={event => {
              setName(event.target.value)
              clearFieldError('name')
            }}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
            slotProps={{ htmlInput: { maxLength: NAME_MAX_LENGTH } }}
          />

          <div>
            <Button
              size='small'
              color='secondary'
              aria-expanded={moreOpen}
              aria-controls={moreId}
              endIcon={<i className={moreOpen ? 'tabler-chevron-up' : 'tabler-chevron-down'} />}
              onClick={() => setMoreOpen(value => !value)}
            >
              {t('more')}
            </Button>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
              {t('moreHint')}
            </Typography>

            <Collapse in={moreOpen} id={moreId}>
              <Box sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {SETTING_FIELDS.map(field => (
                  <CustomTextField
                    key={field}
                    select
                    fullWidth
                    label={t(`fields.${field}`)}
                    value={settings[field]}
                    onChange={event => changeSetting(field, event.target.value)}
                    error={Boolean(fieldErrors[field])}
                    helperText={fieldErrors[field]}
                    slotProps={{ select: { displayEmpty: true } }}
                  >
                    <MenuItem value=''>{t('sameAsCurrent')}</MenuItem>
                    {options[field].map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                ))}
              </Box>
            </Collapse>
          </div>
        </DialogContent>

        <DialogActions>
          <Button color='secondary' disabled={busy} onClick={onClose}>
            {tActions('cancel')}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={busy || !trimmedName}
            startIcon={busy ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
