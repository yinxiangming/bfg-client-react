'use client'

/** Give one server-registered runtime feature to a workspace with an audit reason. */

import { useEffect, useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'

import {
  getHeldEntitlement,
  grantEntitlement,
  MAX_GRANT_MONTHS,
  type ConsoleGrant
} from '@/services/consoleAdmin'

import { formatMoment } from './billingPeriods'
import { refusalMessage } from './refusal'

type Props = {
  open: boolean
  workspaceId: number
  features: string[]
  onClose: () => void
  onGranted: (grant: ConsoleGrant) => void
}

/** How long a grant runs when nobody says otherwise: a year, the usual term. */
const DEFAULT_MONTHS = '12'

export default function GrantEntitlementDialog({ open, workspaceId, features, onClose, onGranted }: Props) {
  const t = useTranslations('admin.console.extensions.grant')
  const tOverview = useTranslations('admin.console.overview')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const [period, setPeriod] = useState<'months' | 'never'>('months')
  const [months, setMonths] = useState(DEFAULT_MONTHS)
  const [reason, setReason] = useState('')
  const [feature, setFeature] = useState('')
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setPeriod('months')
    setMonths(DEFAULT_MONTHS)
    setReason('')
    setFeature(features[0] || '')
    setFailure(null)
  }, [open, features])

  const forMonths = period === 'months'
  const canSave = features.includes(feature) && reason.trim().length > 0 && (!forMonths || months.trim().length > 0) && !saving

  const featureName = (key: string) => (
    tOverview.has(`runtimeFeatures.names.${key}`) ? tOverview(`runtimeFeatures.names.${key}`) : key
  )

  /** What an `already_entitled` refusal says the workspace holds, written out. */
  const alreadyHeld = (error: unknown): string | null => {
    const held = getHeldEntitlement(error)

    if (!held) return null

    return held.current_period_end
      ? t('errors.already_entitled_until', { until: formatMoment(held.current_period_end, locale) })
      : t('errors.already_entitled_forever')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setFailure(null)

    try {
      onGranted(
        await grantEntitlement(workspaceId, {
          key: feature,
          // Exactly one of the two, which is what the server takes: sending both
          // or neither is refused, and a month count of 0 is neither.
          ...(forMonths ? { months: Number(months) } : { never_expires: true }),
          reason: reason.trim()
        })
      )
    } catch (error) {
      setFailure(
        alreadyHeld(error) ??
          refusalMessage(error, t('failed'), code => (t.has(`errors.${code}`) ? t(`errors.${code}`) : null))
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} fullWidth maxWidth='sm' onClose={saving ? undefined : onClose}>
      <form onSubmit={submit}>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 4, pt: 1 }}>
            <Alert severity='info'>{t('notSwitchedOn')}</Alert>

            {failure && <Alert severity='error'>{failure}</Alert>}

            <TextField
              fullWidth
              select
              label={t('what')}
              value={feature}
              onChange={event => setFeature(event.target.value)}
              helperText={t('runtimeFeatureHint')}
            >
              {features.map(runtimeFeature => (
                <MenuItem key={runtimeFeature} value={runtimeFeature}>
                  {featureName(runtimeFeature)}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <RadioGroup value={period} onChange={event => setPeriod(event.target.value as 'months' | 'never')}>
                <FormControlLabel value='months' control={<Radio />} label={t('forMonths')} />
                <FormControlLabel value='never' control={<Radio />} label={t('neverExpires')} />
              </RadioGroup>
              <TextField
                type='number'
                size='small'
                required={forMonths}
                disabled={!forMonths}
                label={t('months')}
                value={months}
                onChange={event => setMonths(event.target.value)}
                slotProps={{ htmlInput: { min: 1, max: MAX_GRANT_MONTHS, step: 1 } }}
                helperText={t('monthsHint', { max: MAX_GRANT_MONTHS })}
                sx={{ maxWidth: 240 }}
              />
            </Box>

            <TextField
              fullWidth
              required
              multiline
              minRows={2}
              label={t('reason')}
              value={reason}
              onChange={event => setReason(event.target.value)}
              helperText={t('reasonHint')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' disabled={saving} onClick={onClose}>
            {tActions('cancel')}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={!canSave}
            startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            {t('save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
