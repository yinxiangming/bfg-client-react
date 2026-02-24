'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import Link from 'next/link'
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'

// Component Imports
import CustomTextField from '@components/ui/TextField'

// Utils Imports
import { meApi } from '@/utils/meApi'

import { DEFAULT_AVATAR_URL } from '@/utils/media'

const DEFAULT_AVATAR = DEFAULT_AVATAR_URL

const Information = () => {
  const t = useTranslations('account.information')

  // States
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isUnauthorized, setIsUnauthorized] = useState(false)
  const [imgSrc, setImgSrc] = useState<string>(DEFAULT_AVATAR)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    language: '',
    timezone_name: ''
  })

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'zh-hans', label: '简体中文' },
    { value: 'zh-hant', label: '繁體中文' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'de', label: 'Deutsch' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'ar', label: 'العربية' }
  ]

  // Timezone options
  const timezoneOptions = [
    { value: 'UTC', label: 'UTC (GMT+0)' },
    { value: 'Pacific/Auckland', label: 'Pacific/Auckland (GMT+13)' },
    { value: 'Asia/Shanghai', label: 'Asia/Shanghai (GMT+8)' },
    { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (GMT-8)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+10)' }
  ]

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await meApi.getMe()

        setFormData({
          username: data.username || '',
          email: data.email || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          language: data.language || '',
          timezone_name: data.timezone_name || ''
        })

        if (data.avatar) {
          setImgSrc(data.avatar)
        }
      } catch (err: any) {
        const errorMessage = err.message || t('failedLoad')
        setError(errorMessage)
        console.error('Failed to fetch user data:', err)

        // Check if token exists
        const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token')

        // If unauthorized or forbidden, show login prompt
        if (err.status === 401 || err.status === 403) {
          setIsUnauthorized(true)

          if (!hasToken) {
            console.warn('No auth token found. Please log in to get a token.')
          } else {
            console.warn('Token present but request failed. Token may be invalid or expired.')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleFileInputChange = (file: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader()
    const { files } = file.target

    if (files && files.length !== 0) {
      const selectedFile = files[0]
      setAvatarFile(selectedFile)

      reader.onload = () => {
        if (reader.result) {
          setImgSrc(reader.result as string)
        }
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleFileInputReset = () => {
    setImgSrc(DEFAULT_AVATAR)
    setAvatarFile(null)
    // Reset file input
    const fileInput = document.getElementById('account-information-upload-image') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Include avatar file if selected
      const updateData: any = { ...formData }
      if (avatarFile) {
        updateData.avatar = avatarFile
      }

      await meApi.updateMe(updateData)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      // Clear avatar file after successful upload
      setAvatarFile(null)
    } catch (err: any) {
      setError(err.message || t('failedUpdate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component='form' onSubmit={handleSubmit} sx={{ mx: 'auto' }}>
      <Card
        variant='outlined'
        sx={{
          borderRadius: 2,
          boxShadow: 'none',
          border: theme => `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper'
        }}
      >
        <CardContent sx={{ px: { xs: 3, md: 4 }, pt: 3, pb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
              alignItems: { md: 'center' },
              mb: 4
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: 112,
                height: 112,
                borderRadius: 2,
                overflow: 'hidden',
                border: theme => `1px solid ${theme.palette.divider}`,
                boxShadow: 'none'
              }}
            >
              <Avatar
                src={imgSrc}
                alt='Profile'
                sx={{ width: '100%', height: '100%', borderRadius: 2, objectFit: 'cover' }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Button
                  component='label'
                  variant='outlined'
                  color='primary'
                  sx={{ px: 3, py: 1.25, fontWeight: 600, textTransform: 'uppercase' }}
                  htmlFor='account-information-upload-image'
                >
                  {t('uploadNewPhoto')}
                  <input
                    hidden
                    type='file'
                    accept='image/png, image/jpeg'
                    onChange={handleFileInputChange}
                    id='account-information-upload-image'
                  />
                </Button>
                <Button
                  variant='outlined'
                  color='secondary'
                  onClick={handleFileInputReset}
                  sx={{ px: 3, py: 1.25, fontWeight: 600, textTransform: 'uppercase' }}
                >
                  {t('reset')}
                </Button>
              </Box>
              <Typography variant='body2' color='text.secondary'>
                {t('photoHint')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {isUnauthorized && (
            <Alert
              severity='warning'
              sx={{ mb: 3 }}
              action={
                <Button color='inherit' size='small' component={Link} href='/auth/login'>
                  {t('login')}
                </Button>
              }
            >
              {t('loginPrompt')}
            </Alert>
          )}
          {error && !isUnauthorized && (
            <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity='success' sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
              {t('updateSuccess')}
            </Alert>
          )}

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                fullWidth
                label={t('username')}
                value={formData.username}
                disabled
                placeholder={t('username')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                fullWidth
                label={t('email')}
                type='email'
                value={formData.email}
                placeholder={t('email')}
                onChange={e => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                fullWidth
                label={t('firstName')}
                value={formData.first_name}
                placeholder={t('firstName')}
                onChange={e => handleFormChange('first_name', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                fullWidth
                label={t('lastName')}
                value={formData.last_name}
                placeholder={t('lastName')}
                onChange={e => handleFormChange('last_name', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                fullWidth
                label={t('phone')}
                value={formData.phone}
                placeholder={t('phone')}
                onChange={e => handleFormChange('phone', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t('language')}
                value={formData.language}
                onChange={e => handleFormChange('language', e.target.value)}
                slotProps={{
                  select: { MenuProps: { PaperProps: { style: { maxHeight: 250 } } } }
                }}
              >
                {languageOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                select
                fullWidth
                label={t('timezone')}
                value={formData.timezone_name}
                onChange={e => handleFormChange('timezone_name', e.target.value)}
                slotProps={{
                  select: { MenuProps: { PaperProps: { style: { maxHeight: 250 } } } }
                }}
              >
                {timezoneOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pt: 1 }}>
              <Button variant='contained' type='submit' disabled={saving || loading} sx={{ px: 4, py: 1.25 }}>
                {saving ? t('saving') : t('saveChanges')}
              </Button>
              <Button
                variant='outlined'
                type='button'
                color='secondary'
                disabled={saving || loading}
                sx={{ px: 4, py: 1.25 }}
                onClick={() => window.location.reload()}
              >
                {t('reset')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Information
