'use client'

/**
 * Step zero: pick a country and an industry, and let the wizard write the rest.
 *
 * The three contact fields are here rather than behind a deep link because the
 * generated privacy, terms and returns pages quote them. Collecting them a
 * screen later would mean publishing legal copy that reads "[email address]"
 * and hoping someone comes back.
 */

import { useEffect, useMemo, useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import CustomTextField from '@/components/ui/TextField'
import { getWorkspaceSettings, updateGeneralSettings } from '@/services/settings'
import {
  applyTemplate,
  getOnboardingOptions,
  getOnboardingStatus,
  localised,
  previewTemplate,
  type CountryOption,
  type IndustryOption,
  type OnboardingStatus,
  type TemplateChange,
  type TemplatePreview
} from '@/services/onboarding'

type QuickStartCardProps = {
  status: OnboardingStatus
  onApplied: (status: OnboardingStatus) => void
}

/**
 * Change kinds the API emits, mapped to their heading.
 *
 * Listed rather than interpolated into `t()`: a kind added server-side then
 * shows up as its raw key in the dialog, which is a visible prompt to add the
 * copy, instead of next-intl throwing on a missing message mid-render.
 */
const KIND_LABEL_KEYS = {
  settings: 'preview.kind.settings',
  currency: 'preview.kind.currency',
  tax_rate: 'preview.kind.taxRate',
  store: 'preview.kind.store',
  warehouse: 'preview.kind.warehouse',
  zone: 'preview.kind.zone',
  category: 'preview.kind.category',
  page: 'preview.kind.page',
  menu: 'preview.kind.menu',
  shop_settings: 'preview.kind.shopSettings',
  site: 'preview.kind.site',
  content: 'preview.kind.content'
} as const

/** Group a change list into "12 pages, 8 categories, 2 menus" for the dialog. */
function summarise(changes: TemplateChange[]) {
  const created = changes.filter(change => change.action !== 'keep')
  const byKind = new Map<string, TemplateChange[]>()

  for (const change of created) {
    byKind.set(change.kind, [...(byKind.get(change.kind) ?? []), change])
  }

  return Array.from(byKind.entries())
}

const QuickStartCard = ({ status, onApplied }: QuickStartCardProps) => {
  const t = useTranslations('admin.setup')
  const locale = useLocale()

  const [countries, setCountries] = useState<CountryOption[]>([])
  const [industries, setIndustries] = useState<IndustryOption[]>([])
  const [country, setCountry] = useState(status.state.country)
  const [industry, setIndustry] = useState(status.state.industry)
  const [siteName, setSiteName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const [loadingOptions, setLoadingOptions] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState<TemplatePreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Prefill from the workspace. These three are real Settings fields, and a
    // form that shows them blank when they are already set reads as one that
    // does not save.
    getWorkspaceSettings()
      .then(settings => {
        if (cancelled) return
        const general = settings.custom_settings?.general ?? {}

        // Functional form: the fetch can land after the user has started
        // typing, and clobbering what they just typed is worse than showing
        // them a blank field.
        setSiteName(current => current || general.site_name || settings.site_name || '')
        setContactEmail(current => current || general.contact_email || '')
        setContactPhone(current => current || general.contact_phone || '')
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    getOnboardingOptions()
      .then(options => {
        if (cancelled) return
        setCountries(options.countries)
        setIndustries(options.industries)
        setCountry(current => current || options.defaults.country)
        setIndustry(current => current || options.defaults.industry)
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectedCountry = useMemo(
    () => countries.find(item => item.code === country),
    [countries, country]
  )

  const overrides = () => ({
    ...(siteName ? { site_name: siteName } : {}),
    ...(contactEmail ? { contact_email: contactEmail } : {}),
    ...(contactPhone ? { contact_phone: contactPhone } : {})
  })

  /**
   * Save just the three contact fields, without running a template.
   *
   * `apply` persists them too, but making "fix my email address" require
   * creating twelve pages is the wrong trade — and until this existed the card
   * looked like a form with no save button.
   */
  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const settings = await getWorkspaceSettings()

      // updateGeneralSettings replaces custom_settings.general wholesale, so
      // merge — a partial payload here would drop the logo, footer and the rest.
      await updateGeneralSettings(settings.id, {
        ...(settings.custom_settings?.general ?? {}),
        site_name: siteName,
        contact_email: contactEmail,
        contact_phone: contactPhone
      })
      onApplied(await getOnboardingStatus())
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    setBusy(true)
    setError(null)

    try {
      setPreview(await previewTemplate(country, industry, overrides()))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setBusy(false)
    }
  }

  const handleApply = async () => {
    setBusy(true)
    setError(null)

    try {
      const result = await applyTemplate(country, industry, overrides())

      setPreview(null)
      onApplied(result.status)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply')
    } finally {
      setBusy(false)
    }
  }

  const alreadyApplied = Boolean(status.state.applied_at)

  if (loadingOptions) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={28} />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Box>
            <Typography variant='h5' sx={{ mb: 1 }}>
              {t('quickStart.title')}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {t('quickStart.subtitle')}
            </Typography>
          </Box>

          {error && <Alert severity='error'>{error}</Alert>}

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t('quickStart.country')}
                value={country}
                onChange={event => setCountry(event.target.value)}
              >
                {countries.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {localised(option, 'name', locale)}
                  </MenuItem>
                ))}
              </CustomTextField>
              {selectedCountry && (
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                  {t('quickStart.countryImplies', {
                    currency: selectedCountry.currency,
                    timezone: selectedCountry.timezone,
                    tax: `${selectedCountry.tax.name} ${selectedCountry.tax.rate}%`
                  })}
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t('quickStart.industry')}
                value={industry}
                onChange={event => setIndustry(event.target.value)}
              >
                {industries.map(option => (
                  <MenuItem key={option.key} value={option.key}>
                    {localised(option, 'name', locale)}
                  </MenuItem>
                ))}
              </CustomTextField>
              {industries.find(item => item.key === industry) && (
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                  {localised(industries.find(item => item.key === industry)!, 'description', locale)}
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <CustomTextField
                fullWidth
                label={t('quickStart.siteName')}
                placeholder={t('quickStart.siteNamePlaceholder')}
                value={siteName}
                onChange={event => setSiteName(event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <CustomTextField
                fullWidth
                type='email'
                label={t('quickStart.contactEmail')}
                placeholder='hello@example.com'
                value={contactEmail}
                onChange={event => setContactEmail(event.target.value)}
                helperText={t('quickStart.contactEmailHelp')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <CustomTextField
                fullWidth
                label={t('quickStart.contactPhone')}
                value={contactPhone}
                onChange={event => setContactPhone(event.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant='contained' onClick={handlePreview} disabled={busy || saving}>
              {busy ? <CircularProgress size={18} color='inherit' /> : t('quickStart.preview')}
            </Button>
            <Button variant='tonal' color='secondary' onClick={handleSave} disabled={busy || saving}>
              {saving ? <CircularProgress size={18} color='inherit' /> : t('quickStart.save')}
            </Button>
            {saved && !saving && (
              <Typography variant='caption' color='success.main'>
                {t('quickStart.saved')}
              </Typography>
            )}
            {alreadyApplied && (
              <Typography variant='caption' color='text.secondary'>
                {t('quickStart.rerunSafe')}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('preview.title')}</DialogTitle>
        <DialogContent dividers>
          {preview && summarise(preview.changes).length === 0 && (
            <Typography variant='body2' color='text.secondary'>
              {t('preview.nothingToDo')}
            </Typography>
          )}
          {preview && summarise(preview.changes).length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('preview.intro')}
              </Typography>
              {summarise(preview.changes).map(([kind, items]) => (
                <Box key={kind} sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                  <Chip size='small' label={items.length} />
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      {kind in KIND_LABEL_KEYS ? t(KIND_LABEL_KEYS[kind as keyof typeof KIND_LABEL_KEYS] as any) : kind}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {items
                        .slice(0, 6)
                        .map(item => item.label)
                        .join(', ')}
                      {items.length > 6 ? ' …' : ''}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <Alert severity='info'>{t('preview.nonDestructive')}</Alert>
              {preview.tax.note && <Alert severity='warning'>{localised(preview.tax, 'note', locale)}</Alert>}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={() => setPreview(null)} disabled={busy}>
            {t('preview.cancel')}
          </Button>
          <Button variant='contained' onClick={handleApply} disabled={busy}>
            {busy ? <CircularProgress size={18} color='inherit' /> : t('preview.apply')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default QuickStartCard
