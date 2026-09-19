'use client'

/**
 * Pricing a meter from a moment on.
 *
 * Adding, never editing: a vendor's new rate is another row with a later
 * moment, so a bill already issued can still be explained by the row it was
 * calculated from. The dialog says so, because a form that looks like an edit
 * form invites somebody to look for the one that changes yesterday's price.
 *
 * `unit_size` is asked for rather than defaulted, and the field says what it
 * means: a rate quoted per million tokens entered as a cost with no unit size
 * would price every single token at a million times what it should be.
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

import { addMeterPrice, type ConsoleMeterPrices } from '@/services/consoleAdmin'

import { refusalMessage } from '../refusal'

type Props = {
  open: boolean
  /** The meter the dialog was opened from; empty when it was opened for any. */
  meter: string
  /** What the deployment's margin is, for the hint under the margin field. */
  defaultMargin: string | null
  onClose: () => void
  onAdded: (prices: ConsoleMeterPrices) => void
}

export default function MeterPriceAddDialog({ open, meter, defaultMargin, onClose, onAdded }: Props) {
  const t = useTranslations('admin.console.platform')
  const tActions = useTranslations('admin.common.actions')
  const [key, setKey] = useState('')
  const [vendorCost, setVendorCost] = useState('')
  const [unitSize, setUnitSize] = useState('1')
  const [margin, setMargin] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setKey(meter)
    setVendorCost('')
    setUnitSize('1')
    setMargin('')
    setEffectiveFrom('')
    setFailure(null)
  }, [open, meter])

  const canSave = key.trim().length > 0 && vendorCost.trim().length > 0 && unitSize.trim().length > 0 && !saving

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setFailure(null)

    try {
      onAdded(
        await addMeterPrice({
          meter: key.trim(),
          vendor_cost: vendorCost.trim(),
          unit_size: unitSize.trim(),
          // Left empty the price follows the deployment's margin, and moves when
          // that moves; sending the same share as a number would pin it instead.
          ...(margin.trim() ? { margin: margin.trim() } : {}),
          ...(effectiveFrom ? { effective_from: effectiveFrom } : {})
        })
      )
    } catch (error) {
      setFailure(refusalMessage(error, t('prices.saveFailed'), code => (t.has(`errors.${code}`) ? t(`errors.${code}`) : null)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} fullWidth maxWidth='sm' onClose={saving ? undefined : onClose}>
      <form onSubmit={submit}>
        <DialogTitle>{t('prices.add')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 4, pt: 1 }}>
            <Alert severity='info'>{t('prices.addOnly')}</Alert>

            {failure && <Alert severity='error'>{failure}</Alert>}

            <TextField
              fullWidth
              required
              autoFocus={!meter}
              label={t('prices.columns.meter')}
              value={key}
              onChange={event => setKey(event.target.value)}
              helperText={t('prices.meterHint')}
            />

            <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                fullWidth
                required
                label={t('prices.columns.vendorCost')}
                value={vendorCost}
                onChange={event => setVendorCost(event.target.value)}
                helperText={t('prices.vendorCostHint')}
              />
              <TextField
                fullWidth
                required
                label={t('prices.columns.unitSize')}
                value={unitSize}
                onChange={event => setUnitSize(event.target.value)}
                helperText={t('prices.unitSizeHint')}
              />
            </Box>

            <TextField
              fullWidth
              label={t('prices.columns.margin')}
              value={margin}
              onChange={event => setMargin(event.target.value)}
              helperText={
                defaultMargin === null
                  ? t('prices.marginHint')
                  : t('prices.marginHintDefault', { margin: defaultMargin })
              }
            />

            <TextField
              fullWidth
              type='datetime-local'
              label={t('prices.columns.effectiveFrom')}
              value={effectiveFrom}
              onChange={event => setEffectiveFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={t('prices.effectiveFromHint')}
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
            {t('prices.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
