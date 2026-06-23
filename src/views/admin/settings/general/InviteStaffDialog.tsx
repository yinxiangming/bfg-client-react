'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@/components/ui/TextField'

// Util Imports
import { apiFetch, bfgApi } from '@/utils/api'

export type StaffRole = {
  id: number
  name: string
  code: string
}

type InviteUser = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export type Invitation = {
  id: number
  uuid: string
  email: string
  role: StaffRole
  status: InvitationStatus
  invited_by: InviteUser | null
  expires_at: string
  created_at: string
}

export const EXPIRY_OPTIONS = [24, 48, 72, 168, 336]
export const DEFAULT_EXPIRY_HOURS = 48

/** Tonal color per invitation status, shared with the unified Users/Status column. */
export const INVITATION_STATUS_COLOR: Record<InvitationStatus, 'warning' | 'success' | 'default' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  expired: 'default',
  revoked: 'error'
}

type InviteDialogProps = {
  open: boolean
  roles: StaffRole[]
  onClose: () => void
  onInvited: (invitation: Invitation) => void
}

const InviteStaffDialog = ({ open, roles, onClose, onInvited }: InviteDialogProps) => {
  const t = useTranslations('admin.staff.invite')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState<number>(roles[0]?.id ?? 0)
  const [expiryHours, setExpiryHours] = useState<number>(DEFAULT_EXPIRY_HOURS)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Default the role select once roles load
  useEffect(() => {
    if (!roleId && roles[0]) setRoleId(roles[0].id)
  }, [roles, roleId])

  // Reset fields whenever the dialog is (re)opened
  useEffect(() => {
    if (open) {
      setEmail('')
      setMessage('')
      setExpiryHours(DEFAULT_EXPIRY_HOURS)
      setRoleId(roles[0]?.id ?? 0)
      setError('')
    }
  }, [open, roles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !roleId) return
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch<{ created: Invitation[]; errors: { email: string; error: unknown }[] }>(
        bfgApi.staffInvitations(),
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            role_id: roleId,
            expiry_hours: expiryHours,
            message: message.trim() || undefined
          })
        }
      )
      if (res.created?.length) {
        onInvited(res.created[0])
        return
      }
      const firstErr = res.errors?.[0]?.error
      const msg =
        typeof firstErr === 'string'
          ? firstErr
          : firstErr && typeof firstErr === 'object'
            ? Object.values(firstErr as Record<string, unknown>)[0]?.toString() ?? t('failed')
            : t('failed')
      setError(msg)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            {t('hint')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <CustomTextField
              fullWidth
              required
              type='email'
              label={t('emailLabel')}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <CustomTextField
              select
              fullWidth
              label={t('assignRole')}
              value={roleId || ''}
              onChange={e => setRoleId(Number(e.target.value))}
            >
              {roles.map(r => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </MenuItem>
              ))}
            </CustomTextField>
            <CustomTextField
              select
              fullWidth
              label={t('expiryLabel')}
              value={expiryHours}
              onChange={e => setExpiryHours(Number(e.target.value))}
            >
              {EXPIRY_OPTIONS.map(h => (
                <MenuItem key={h} value={h}>
                  {t('expiryHours', { hours: h })}
                </MenuItem>
              ))}
            </CustomTextField>
            <CustomTextField
              fullWidth
              multiline
              rows={3}
              label={t('messageLabel')}
              placeholder={t('messagePlaceholder')}
              value={message}
              onChange={e => setMessage(e.target.value)}
              inputProps={{ maxLength: 2000 }}
            />
          </Box>
          {error && (
            <Alert severity='error' sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button color='secondary' onClick={onClose} sx={{ textTransform: 'none' }}>
            {t('cancel')}
          </Button>
          <Button type='submit' variant='contained' disabled={saving || !email.trim() || !roleId} sx={{ textTransform: 'none' }}>
            {saving ? t('submitting') : t('submit')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default InviteStaffDialog
