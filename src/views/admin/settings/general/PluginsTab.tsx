'use client'

/**
 * Workspace-level switches for optional features.
 *
 * These are per-workspace on purpose: one deployment serves several shops, and a
 * feature that costs money per use has to be something an operator turns on for
 * the shop that wants it rather than something every shop gets.
 *
 * Each switch saves only its own key — `updatePluginsSettings` merges into the
 * `plugins` node — so this tab and the Store tab's Product Scanner switch cannot
 * overwrite one another.
 */

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'

import {
  SETTINGS_GUTTER,
  SettingsActionBar,
  SettingsSection
} from '@/components/admin/settings/SettingsSection'
import CustomTextField from '@/components/ui/TextField'
import { getAddressLookupStatus, type AddressLookupStatus } from '@/services/geo'
import {
  getWorkspaceSettings,
  invalidateWorkspaceSettingsCache,
  updatePluginsSettings
} from '@/services/settings'

type AddressLookupData = {
  enabled: boolean
  country_code: string
}

const initialAddressLookup: AddressLookupData = { enabled: false, country_code: '' }

/** ISO 3166-1 alpha-2, or blank to inherit the workspace's market. */
const COUNTRY_CODE_PATTERN = /^[A-Za-z]{2}$/

const PluginsTab = () => {
  const t = useTranslations('admin')
  const [settingsId, setSettingsId] = useState<number | null>(null)
  const [addressLookup, setAddressLookup] = useState<AddressLookupData>(initialAddressLookup)
  const [status, setStatus] = useState<AddressLookupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // What the *server* resolved, not what is stored. The two differ in the one case
  // an operator cannot otherwise diagnose: the switch is on but the deployment has
  // no GOOGLE_MAPS_API_KEY, so nothing works and the settings page looks correct.
  const loadStatus = async () => {
    try {
      setStatus(await getAddressLookupStatus())
    } catch {
      // An older server has no /geo/ route at all. Not an error worth showing —
      // the switch still saves, it just has nothing to report yet.
      setStatus(null)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const settings = await getWorkspaceSettings()
        setSettingsId(settings.id)
        const stored = settings.custom_settings?.plugins?.address_lookup
        setAddressLookup({
          enabled: stored?.enabled ?? initialAddressLookup.enabled,
          country_code: (stored?.country_code ?? initialAddressLookup.country_code).toUpperCase()
        })
        await loadStatus()
      } catch (err: any) {
        setError(t('settings.general.plugins.errors.loadFailed', { error: err.message }))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [t])

  const countryCodeInvalid =
    addressLookup.country_code.length > 0 && !COUNTRY_CODE_PATTERN.test(addressLookup.country_code)

  const handleSave = async () => {
    if (!settingsId) {
      setError(t('settings.general.plugins.errors.settingsIdMissing'))
      return
    }
    if (countryCodeInvalid) {
      setError(t('settings.general.plugins.addressLookup.countryCode.invalid'))
      return
    }

    try {
      setSaving(true)
      setError(null)
      await updatePluginsSettings(settingsId, {
        address_lookup: {
          enabled: addressLookup.enabled,
          country_code: addressLookup.country_code.trim().toUpperCase()
        }
      })
      invalidateWorkspaceSettingsCache()
      // Re-ask the server: the country that is now in force may be the workspace's
      // own market rather than the blank field above, and only the server knows.
      await loadStatus()
      setSuccess(true)
    } catch (err: any) {
      setError(t('settings.general.plugins.errors.saveFailed', { error: err.message }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ px: SETTINGS_GUTTER, pt: 5, pb: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
          {t('settings.general.plugins.title')}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          {t('settings.general.plugins.description')}
        </Typography>
      </Box>

      <SettingsSection
        title={t('settings.general.plugins.addressLookup.title')}
        description={t('settings.general.plugins.addressLookup.description')}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={addressLookup.enabled}
                  onChange={e => setAddressLookup(prev => ({ ...prev, enabled: e.target.checked }))}
                />
              }
              label={
                <Box>
                  <Typography variant='body2'>
                    {t('settings.general.plugins.addressLookup.enabled.label')}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {t('settings.general.plugins.addressLookup.enabled.help')}
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {addressLookup.enabled && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label={t('settings.general.plugins.addressLookup.countryCode.label')}
                  value={addressLookup.country_code}
                  onChange={e =>
                    setAddressLookup(prev => ({
                      ...prev,
                      // Upper-cased as it is typed: the code is shown back in the
                      // status line below, and "nz" next to "NZ" reads as a mismatch.
                      country_code: e.target.value.toUpperCase().slice(0, 2)
                    }))
                  }
                  placeholder={t('settings.general.plugins.addressLookup.countryCode.placeholder')}
                  error={countryCodeInvalid}
                  helperText={
                    countryCodeInvalid
                      ? t('settings.general.plugins.addressLookup.countryCode.invalid')
                      : t('settings.general.plugins.addressLookup.countryCode.help')
                  }
                  slotProps={{ input: { startAdornment: <i className='tabler-map-pin' /> } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    size='small'
                    color={status?.enabled ? 'success' : 'warning'}
                    variant='tonal'
                    label={
                      status?.enabled
                        ? t('settings.general.plugins.addressLookup.status.live', {
                            country: status.country_code
                          })
                        : t('settings.general.plugins.addressLookup.status.notLive')
                    }
                  />
                  <Typography variant='caption' color='text.secondary'>
                    {status?.enabled
                      ? t('settings.general.plugins.addressLookup.status.liveHelp')
                      : t('settings.general.plugins.addressLookup.status.notLiveHelp')}
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </SettingsSection>

      <SettingsActionBar>
        <Button variant='contained' onClick={handleSave} disabled={saving || countryCodeInvalid}>
          {saving ? t('settings.general.plugins.saving') : t('settings.general.plugins.save')}
        </Button>
      </SettingsActionBar>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setSuccess(false)}>
          {t('settings.general.plugins.saved')}
        </Alert>
      </Snackbar>
    </>
  )
}

export default PluginsTab
