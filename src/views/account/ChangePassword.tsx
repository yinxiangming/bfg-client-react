'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

// Component Imports
import CustomTextField from '@components/ui/TextField'

// Utils Imports
import { meApi } from '@/utils/meApi'

const ChangePassword = () => {
  const t = useTranslations('account.changePassword')

  // States
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
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
      
      await meApi.changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      })
      
      setSuccess(true)
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || t('failedChange'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity='error' className='mbe-4' onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity='success' className='mbe-4' onClose={() => setSuccess(false)}>
                  {t('passwordChanged')}
                </Alert>
              )}
              <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    fullWidth
                    label={t('currentPassword')}
                    type={showOldPassword ? 'text' : 'password'}
                    value={formData.old_password}
                    onChange={e => handleFormChange('old_password', e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={showOldPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    fullWidth
                    label={t('newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.new_password}
                    onChange={e => handleFormChange('new_password', e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={showNewPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    fullWidth
                    label={t('confirmNewPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={e => handleFormChange('confirm_password', e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              edge='end'
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              onMouseDown={e => e.preventDefault()}
                            >
                              <i className={showConfirmPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='body2' color='text.secondary'>
                    {t('passwordHint')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }} className='flex gap-4 flex-wrap'>
                  <Button variant='contained' type='submit' disabled={saving}>
                    {saving ? t('changingPassword') : t('changePassword')}
                  </Button>
                  <Button
                    variant='tonal'
                    type='button'
                    color='secondary'
                    disabled={saving}
                    onClick={() => {
                      setFormData({
                        old_password: '',
                        new_password: '',
                        confirm_password: '',
                      })
                      setError(null)
                    }}
                  >
                    {t('reset')}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ChangePassword
