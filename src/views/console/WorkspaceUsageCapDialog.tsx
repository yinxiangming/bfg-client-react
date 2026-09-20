'use client'

/**
 * Setting how many points of metered usage one workspace may run up in a month.
 *
 * Two answers, and the form makes a reader pick one: follow the platform's
 * default, or give this workspace a cap of its own. They are not the same and
 * neither is an empty box — a cap of zero stops the workspace metering anything
 * at all, while no cap of its own means it moves whenever the platform's default
 * moves — so a single field that meant "nothing" when left blank would make
 * "spend nothing" impossible to say.
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
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { setWorkspaceUsageCap, type ConsoleUsageCap } from '@/services/consoleAdmin'

import { refusalMessage } from './refusal'

type Props = {
  open: boolean
  workspaceId: number
  cap: ConsoleUsageCap
  onClose: () => void
  onChanged: (cap: ConsoleUsageCap) => void
}

export default function WorkspaceUsageCapDialog({ open, workspaceId, cap, onClose, onChanged }: Props) {
  const t = useTranslations('admin.console.usage.allowance')
  const tActions = useTranslations('admin.common.actions')
  const [source, setSource] = useState<'platform' | 'workspace'>('platform')
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // Opened on what the workspace has now, so "follow the default" is already
  // picked for one that follows it and the figure is there to nudge for one
  // that does not.
  useEffect(() => {
    if (!open) return

    setSource(cap.cap_points === null ? 'platform' : 'workspace')
    setPoints(cap.cap_points ?? '')
    setReason('')
    setFailure(null)
  }, [open, cap])

  const ownCap = source === 'workspace'
  const canSave = (!ownCap || points.trim().length > 0) && reason.trim().length >= 3 && !saving

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setFailure(null)

    try {
      // null and "0" are different answers, which is the whole reason for the
      // choice above: null follows the platform, 0 permits nothing.
      onChanged(await setWorkspaceUsageCap(workspaceId, ownCap ? points.trim() : null, reason.trim()))
    } catch (error) {
      setFailure(refusalMessage(error, t('saveFailed'), code => (t.has(`errors.${code}`) ? t(`errors.${code}`) : null)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} fullWidth maxWidth='sm' onClose={saving ? undefined : onClose}>
      <form onSubmit={submit}>
        <DialogTitle>{t('change')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 3, pt: 1 }}>
            {failure && <Alert severity='error'>{failure}</Alert>}

            <RadioGroup value={source} onChange={event => setSource(event.target.value as 'platform' | 'workspace')}>
              <FormControlLabel
                value='platform'
                control={<Radio />}
                label={t('followDefault', { points: cap.default_cap_points })}
              />
              <FormControlLabel value='workspace' control={<Radio />} label={t('ownCap')} />
            </RadioGroup>

            <TextField
              fullWidth
              required={ownCap}
              disabled={!ownCap}
              label={t('points')}
              value={points}
              onChange={event => setPoints(event.target.value)}
              helperText={t('zeroMeansNothing')}
            />

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

            <Typography variant='caption' color='text.secondary'>
              {t('hint')}
            </Typography>
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
