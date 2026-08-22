'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@/components/ui/TextField'
import { SETTINGS_GUTTER, SettingsActionBar } from '@/components/admin/settings/SettingsSection'

// Hook Imports
import { useApiData } from '@/hooks/useApiData'

// TODO: Replace with actual API service
const getWebSettings = async () => {
  // Mock data for now
  await new Promise(resolve => setTimeout(resolve, 500))
  return {
    default_site_id: '',
    default_theme_id: '',
    default_language: 'en',
    enable_comments: true,
    enable_search: true,
    seo_default_title: '',
    seo_default_description: ''
  }
}

const updateWebSettings = async (payload: any) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 300))
  console.log('Update web settings:', payload)
}

const WebSettingsTab = () => {
  const t = useTranslations('admin')
  const { data, loading, error, refetch } = useApiData({
    fetchFn: getWebSettings
  })

  const [formData, setFormData] = useState({
    default_language: 'en',
    enable_comments: true,
    enable_search: true,
    seo_default_title: '',
    seo_default_description: ''
  })

  useEffect(() => {
    if (data) {
      setFormData({
        default_language: data.default_language || 'en',
        enable_comments: data.enable_comments ?? true,
        enable_search: data.enable_search ?? true,
        seo_default_title: data.seo_default_title || '',
        seo_default_description: data.seo_default_description || ''
      })
    }
  }, [data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateWebSettings(formData)
      await refetch()
      alert(t('settings.web.settingsTab.alerts.saved'))
    } catch (err: any) {
      alert(t('settings.web.settingsTab.alerts.saveFailed', { error: err.message }))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', px: SETTINGS_GUTTER, py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ px: SETTINGS_GUTTER, py: 5 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ px: SETTINGS_GUTTER, py: 5 }}>
        <Typography component='h3' sx={{ mb: 4, fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.5 }}>
          {t('settings.web.settingsTab.title')}
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              select
              fullWidth
              label={t('settings.web.settingsTab.fields.defaultLanguage')}
              value={formData.default_language}
              onChange={e => setFormData({ ...formData, default_language: e.target.value })}
            >
              <MenuItem value='en'>{t('settings.web.settingsTab.languageOptions.en')}</MenuItem>
              <MenuItem value='zh-hans'>{t('settings.web.settingsTab.languageOptions.zhHans')}</MenuItem>
              <MenuItem value='zh-hant'>{t('settings.web.settingsTab.languageOptions.zhHant')}</MenuItem>
            </CustomTextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label={t('settings.web.settingsTab.fields.seoDefaultTitle')}
              value={formData.seo_default_title}
              onChange={e => setFormData({ ...formData, seo_default_title: e.target.value })}
              placeholder={t('settings.web.settingsTab.placeholders.seoDefaultTitle')}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label={t('settings.web.settingsTab.fields.seoDefaultDescription')}
              value={formData.seo_default_description}
              onChange={e => setFormData({ ...formData, seo_default_description: e.target.value })}
              placeholder={t('settings.web.settingsTab.placeholders.seoDefaultDescription')}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </Box>

      <SettingsActionBar>
        <Button type='submit' variant='contained'>
          {t('settings.web.settingsTab.actions.saveChanges')}
        </Button>
        <Button type='button' variant='tonal' color='secondary' onClick={() => refetch()}>
          {t('settings.web.settingsTab.actions.reset')}
        </Button>
      </SettingsActionBar>
    </form>
  )
}

export default WebSettingsTab

