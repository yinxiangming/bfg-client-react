'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'

// Component Imports
import Icon from '@components/Icon'
import CustomTextField from '@components/ui/TextField'
import { AccountCard } from '@/components/account/AccountUI'

// Utils Imports
import { meApi } from '@/utils/meApi'

type Field = 'old_password' | 'new_password' | 'confirm_password'

const EMPTY = { old_password: '', new_password: '', confirm_password: '' }

const FIELDS: { key: Field; label: string; autoComplete: string }[] = [
  { key: 'old_password', label: 'currentPassword', autoComplete: 'current-password' },
  { key: 'new_password', label: 'newPassword', autoComplete: 'new-password' },
  { key: 'confirm_password', label: 'confirmNewPassword', autoComplete: 'new-password' }
]

const ChangePassword = () => {
  const t = useTranslations('account.changePassword')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [visible, setVisible] = useState<Record<Field, boolean>>({
    old_password: false,
    new_password: false,
    confirm_password: false
  })
  const [formData, setFormData] = useState(EMPTY)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.old_password || !formData.new_password || !formData.confirm_password) {
      setError(t('allFieldsRequired'))

      return
    }

    if (formData.new_password !== formData.confirm_password) {
      setError(t('passwordMismatch'))

      return
    }

    if (formData.new_password.length < 8) {
      setError(t('passwordTooShort'))

      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      await meApi.changePassword(formData)
      setSuccess(true)
      setFormData(EMPTY)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedChange'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccountCard title={t('changePassword')}>
      <form onSubmit={handleSubmit}>
        <div className='acc-form acc-form--narrow'>
          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity='success' onClose={() => setSuccess(false)}>
              {t('passwordChanged')}
            </Alert>
          )}
          {FIELDS.map(field => (
            <CustomTextField
              key={field.key}
              fullWidth
              label={t(field.label)}
              type={visible[field.key] ? 'text' : 'password'}
              autoComplete={field.autoComplete}
              value={formData[field.key]}
              onChange={event => {
                const value = event.target.value

                setFormData(current => ({ ...current, [field.key]: value }))
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        size='small'
                        onClick={() => setVisible(current => ({ ...current, [field.key]: !current[field.key] }))}
                        onMouseDown={event => event.preventDefault()}
                      >
                        <Icon icon={visible[field.key] ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
          ))}
          <div className='acc-sub'>{t('passwordHint')}</div>
        </div>
        <div className='acc-card-foot acc-card-foot--end'>
          <Button
            type='button'
            disabled={saving}
            onClick={() => {
              setFormData(EMPTY)
              setError(null)
            }}
          >
            {t('reset')}
          </Button>
          <Button variant='contained' type='submit' disabled={saving}>
            {saving ? t('changingPassword') : t('changePassword')}
          </Button>
        </div>
      </form>
    </AccountCard>
  )
}

export default ChangePassword
