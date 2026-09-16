'use client'

/**
 * Changing one of the deployment's own numbers.
 *
 * A reason is required and the field says so, because the server refuses a
 * change without one and because the change is kept for as long as the bills it
 * explains: "why is the margin 0.45" has to be answerable from the row itself a
 * year later. The dialog keeps the refusal rather than closing on it, so what
 * was typed is still there to correct.
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
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
  setPlatformVariable,
  type ConsolePlatformVariable,
  type ConsoleVariableValue
} from '@/services/consoleAdmin'

import { refusalMessage } from '../refusal'
import { variableText } from './panels'

type Props = {
  /** The variable being changed; null closes the dialog. */
  variable: ConsolePlatformVariable | null
  onClose: () => void
  onChanged: (variable: ConsolePlatformVariable) => void
}

/** A value as a field holds it: a decimal string as it arrived, a number or a boolean written out. */
function asText(value: ConsoleVariableValue): string {
  return String(value)
}

export default function VariableChangeDialog({ variable, onClose, onChanged }: Props) {
  const t = useTranslations('admin.console.platform')
  const tActions = useTranslations('admin.common.actions')
  const [value, setValue] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // Opened on a variable, it starts at what that variable is now: most changes
  // are a nudge to the number already there rather than a fresh one.
  useEffect(() => {
    if (!variable) return

    setValue(asText(variable.value))
    setReason('')
    setFailure(null)
  }, [variable])

  if (!variable) return null

  const isBool = variable.kind === 'bool'
  const defaultText = variableText(variable.default, { yes: t('variables.true'), no: t('variables.false') })
  const canSave = reason.trim().length > 0 && (isBool || value.trim().length > 0) && !saving

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setFailure(null)

    try {
      // Numbers go as the text that was typed, never through a float: the
      // server reads a decimal string exactly, and 0.3 round-tripped through a
      // JSON number is not 0.3 any more.
      const sent: ConsoleVariableValue = isBool ? value === 'true' : value.trim()

      onChanged(await setPlatformVariable(variable.key, sent, reason.trim()))
    } catch (error) {
      setFailure(refusalMessage(error, t('variables.saveFailed'), code => (t.has(`errors.${code}`) ? t(`errors.${code}`) : null)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open fullWidth maxWidth='sm' onClose={saving ? undefined : onClose}>
      <form onSubmit={submit}>
        <DialogTitle>{t('variables.change', { key: variable.key })}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 4, pt: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              {variable.description}
            </Typography>

            {failure && <Alert severity='error'>{failure}</Alert>}

            {isBool ? (
              <TextField
                select
                fullWidth
                label={t('variables.columns.value')}
                value={value}
                onChange={event => setValue(event.target.value)}
                helperText={t('variables.defaultIs', { value: defaultText })}
              >
                <MenuItem value='true'>{t('variables.true')}</MenuItem>
                <MenuItem value='false'>{t('variables.false')}</MenuItem>
              </TextField>
            ) : (
              <TextField
                fullWidth
                autoFocus
                label={t('variables.columns.value')}
                value={value}
                onChange={event => setValue(event.target.value)}
                helperText={t(
                  variable.kind === 'int' ? 'variables.wholeNumberDefault' : 'variables.defaultIs',
                  { value: defaultText }
                )}
              />
            )}

            <TextField
              fullWidth
              required
              multiline
              minRows={2}
              label={t('variables.reason')}
              value={reason}
              onChange={event => setReason(event.target.value)}
              helperText={t('variables.reasonHint')}
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
            {t('variables.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
