'use client'

/**
 * Giving a workspace something it has not paid for, for a platform administrator.
 *
 * The base plan is one of the things that can be granted and it is not an
 * extension, so it is the first entry in the same picker rather than a control
 * of its own: what is being given and for how long is one question, and a
 * separate button for the plan would have somebody hunting for where plans are
 * granted. The server takes it as a key like any other — the empty one.
 *
 * A reason is required, as it is for every platform change that costs the
 * deployment money, and it stays on the entitlement row.
 *
 * Granting does not switch an extension on. The one exception is an extension
 * the platform itself paused when an entitlement ran out, which is resumed;
 * whoever grants is told which happened rather than left to check the card.
 */

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

import { extensionName, type ConsoleExtension } from '@/services/console'
import {
  BASE_PLAN_KEY,
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
  /** Everything this deployment ships, to pick what is being granted from. */
  extensions: ConsoleExtension[]
  onClose: () => void
  onGranted: (grant: ConsoleGrant) => void
}

/** How long a grant runs when nobody says otherwise: a year, the usual term. */
const DEFAULT_MONTHS = '12'

export default function GrantEntitlementDialog({ open, workspaceId, extensions, onClose, onGranted }: Props) {
  const t = useTranslations('admin.console.extensions.grant')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const [key, setKey] = useState(BASE_PLAN_KEY)
  const [period, setPeriod] = useState<'months' | 'never'>('months')
  const [months, setMonths] = useState(DEFAULT_MONTHS)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setKey(BASE_PLAN_KEY)
    setPeriod('months')
    setMonths(DEFAULT_MONTHS)
    setReason('')
    setFailure(null)
  }, [open])

  const forMonths = period === 'months'
  const canSave = reason.trim().length > 0 && (!forMonths || months.trim().length > 0) && !saving

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
          key,
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
              select
              fullWidth
              label={t('what')}
              value={key}
              onChange={event => setKey(event.target.value)}
              helperText={key === BASE_PLAN_KEY ? t('basePlanHint') : undefined}
            >
              <MenuItem value={BASE_PLAN_KEY}>{t('basePlan')}</MenuItem>
              {extensions.map(extension => (
                <MenuItem key={extension.key} value={extension.key}>
                  {extensionName(extension, locale)}
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
