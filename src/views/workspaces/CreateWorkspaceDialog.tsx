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
import { getOnboardingOptions, localised, type CountryOption } from '@/services/onboarding'
import { createTenantWorkspace, getTenantWorkspaceErrorMessage, type TenantWorkspace } from '@/services/platform'
import { switchWorkspace, WorkspaceSwitchError } from '@/utils/switchWorkspace'

/** Message keys in the common namespace for the languages the server supports. */
const LANGUAGE_LABEL_KEYS: Record<string, string> = {
  en: 'language.en',
  'zh-hans': 'language.zhHans'
}

/**
 * What the form offers, from the setup wizard's options (GET /onboarding/options/): the
 * countries the wizard has defaults for, since the wizard is where a new workspace goes next,
 * and the currencies and languages the server accepts. The server refuses any other currency
 * or language; it takes any two-letter country code.
 */
type Choices = {
  countries: CountryOption[]
  currencies: string[]
  languages: string[]
}

const NO_CHOICES: Choices = { countries: [], currencies: [], languages: [] }

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

type PresetField = (typeof PRESET_FIELDS)[number]

/** Which of them the user has picked since the dialog opened. */
type Picked = Record<PresetField, boolean>

const NONE_PICKED: Picked = { currency: false, language: false }

/**
 * The currency and default language the wizard's profile of a country gives it. Only a value
 * the form offers fits: where the profile names another, that field is left out, and choosing
 * the country leaves the field as it is.
 */
function presetFor(choices: Choices, code: string): Partial<Record<PresetField, string>> {
  const country = choices.countries.find(item => item.code === code)
  const preset: Partial<Record<PresetField, string>> = {}

  if (country && choices.currencies.includes(country.currency)) preset.currency = country.currency
  if (country && choices.languages.includes(country.default_language)) preset.language = country.default_language

  return preset
}

/**
 * The settings once a country is chosen. A currency or language the user has not picked
 * follows the country: to its preset, or back to "same as current shop" along with it. One
 * the user has picked stays, and so does one the country's preset has no value for.
 */
function withCountry(settings: Settings, country: string, picked: Picked, choices: Choices): Settings {
  const preset = presetFor(choices, country)
  const next = { ...settings, country }

  for (const field of PRESET_FIELDS) {
    if (picked[field]) continue
    const value = country ? preset[field] : ''
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
  // null until the options load. They are fetched the first time the dialog opens, and again
  // at the next opening when that fails.
  const [choices, setChoices] = useState<Choices | null>(null)
  const [choicesFailed, setChoicesFailed] = useState(false)

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

  useEffect(() => {
    if (!open || choices) return
    let cancelled = false
    setChoicesFailed(false)

    getOnboardingOptions()
      .then(options => {
        if (cancelled) return
        setChoices({
          countries: options.countries,
          // A server that predates the list leaves it out, and the form then offers no currency.
          currencies: options.currencies ?? [],
          languages: options.languages
        })
      })
      .catch(() => {
        if (!cancelled) setChoicesFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [open, choices])

  const available = choices ?? NO_CHOICES

  const options = useMemo<Record<SettingField, Option[]>>(() => {
    let currencyNames: Intl.DisplayNames | null = null
    try {
      currencyNames = new Intl.DisplayNames([locale], { type: 'currency' })
    } catch {
      // Without display names, each currency shows as its code.
    }

    return {
      // Named as the setup wizard names them.
      country: available.countries
        .map(country => ({ value: country.code, label: localised(country, 'name', locale) }))
        .sort((a, b) => a.label.localeCompare(b.label, locale)),
      currency: available.currencies.map(code => {
        const currencyName = currencyNames?.of(code)
        return { value: code, label: currencyName && currencyName !== code ? `${code} — ${currencyName}` : code }
      }),
      language: available.languages.map(code => ({
        value: code,
        label: Object.hasOwn(LANGUAGE_LABEL_KEYS, code) ? tCommon(LANGUAGE_LABEL_KEYS[code]) : code
      }))
    }
  }, [available, locale, tCommon])

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

    const next = withCountry(settings, value, picked, available)
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
                {choicesFailed && <Alert severity='warning'>{t('optionsFailed')}</Alert>}
                {SETTING_FIELDS.map(field => (
                  <CustomTextField
                    key={field}
                    select
                    fullWidth
                    // Nothing to choose from until the options load.
                    disabled={!choices}
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
