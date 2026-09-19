'use client'

/**
 * Entering a rate by hand, for a day the feed could not be read for.
 *
 * A stand-in, not an override that sticks, and the dialog says so before the
 * fields rather than after: the next refresh that does reach the feed replaces
 * this row with the published number and marks it as published again. Somebody
 * typing a rate to correct one they disagree with would otherwise find it
 * quietly gone tomorrow.
 *
 * A day already stored is corrected rather than duplicated, which is why the
 * date is a plain field and not a warning about clashing with an existing row.
 */

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

import { setExchangeRate, type ConsoleExchangeRate } from '@/services/consoleAdmin'

import { refusalMessage } from '../refusal'

type Props = {
  open: boolean
  onClose: () => void
  onAdded: (rate: ConsoleExchangeRate) => void
}

/** Currency codes are three letters, and the field keeps them that way as they are typed. */
function asCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
}

export default function ExchangeRateAddDialog({ open, onClose, onAdded }: Props) {
  const t = useTranslations('admin.console.platform')
  const tActions = useTranslations('admin.common.actions')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [rate, setRate] = useState('')
  const [day, setDay] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setFrom('')
    setTo('')
    setRate('')
    setDay('')
    setReason('')
    setFailure(null)
  }, [open])

  const canSave = from.length === 3 && to.length === 3 && rate.trim().length > 0 && reason.trim().length >= 3 && !saving

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setFailure(null)

    try {
      onAdded(
        await setExchangeRate({
          from,
          to,
          rate: rate.trim(),
          ...(day ? { effective_date: day } : {})
        }, reason.trim())
      )
    } catch (error) {
      setFailure(refusalMessage(error, t('rates.saveFailed'), code => (t.has(`errors.${code}`) ? t(`errors.${code}`) : null)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} fullWidth maxWidth='sm' onClose={saving ? undefined : onClose}>
      <form onSubmit={submit}>
        <DialogTitle>{t('rates.add')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 4, pt: 1 }}>
            <Alert severity='warning'>{t('rates.overwritten')}</Alert>

            {failure && <Alert severity='error'>{failure}</Alert>}

            <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
              <TextField
                fullWidth
                required
                autoFocus
                label={t('rates.columns.from')}
                value={from}
                onChange={event => setFrom(asCode(event.target.value))}
                placeholder='USD'
              />
              <TextField
                fullWidth
                required
                label={t('rates.columns.to')}
                value={to}
                onChange={event => setTo(asCode(event.target.value))}
                placeholder='NZD'
              />
              <TextField
                fullWidth
                required
                label={t('rates.columns.rate')}
                value={rate}
                onChange={event => setRate(event.target.value)}
              />
            </Box>

            <TextField
              fullWidth
              type='date'
              label={t('rates.columns.day')}
              value={day}
              onChange={event => setDay(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={t('rates.dayHint')}
            />

            <TextField
              fullWidth
              required
              multiline
              minRows={2}
              label={t('rates.reason')}
              value={reason}
              onChange={event => setReason(event.target.value)}
              helperText={t('rates.reasonHint')}
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
            {t('rates.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
