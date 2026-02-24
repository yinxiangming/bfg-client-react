'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

// Services & Types
import { getResaleSettings, updateResaleSettings } from '../../services'
import type { ResaleSettings } from '../../types'

const ResaleSettingsPage = () => {
  const t = useTranslations('resale')
  const [settings, setSettings] = useState<Partial<ResaleSettings>>({
    enabled: false,
    commission_rate: 80,
    max_products_per_customer: 50,
    default_listing_days: 90,
    terms_and_conditions: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getResaleSettings()
      if (data) {
        setSettings(data)
      }
    } catch (err) {
      // Settings may not exist yet, use defaults
      console.warn('Failed to load resale settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await updateResaleSettings(settings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.saveSettingsFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof ResaleSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardHeader
        title={t('admin.settings.title')}
        subheader={t('admin.settings.subtitleAlt')}
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{t('admin.settings.saved')}</Alert>}

          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled || false}
                onChange={(e) => handleChange('enabled', e.target.checked)}
              />
            }
            label={t('admin.settings.enableProgram')}
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            {t('admin.settings.commissionSettings')}
          </Typography>

          <TextField
            fullWidth
            label={t('admin.settings.commissionRateLabel')}
            type="number"
            value={settings.commission_rate || 80}
            onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value) || 0)}
            helperText={t('admin.settings.commissionRateHelper')}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            {t('admin.settings.listingSettings')}
          </Typography>

          <TextField
            fullWidth
            label={t('admin.settings.maxProductsLabel')}
            type="number"
            value={settings.max_products_per_customer || 50}
            onChange={(e) => handleChange('max_products_per_customer', parseInt(e.target.value) || 0)}
            helperText={t('admin.settings.maxProductsHelper')}
            inputProps={{ min: 1 }}
          />

          <TextField
            fullWidth
            label={t('admin.settings.defaultListingLabel')}
            type="number"
            value={settings.default_listing_days || 90}
            onChange={(e) => handleChange('default_listing_days', parseInt(e.target.value) || 0)}
            helperText={t('admin.settings.defaultListingHelper')}
            inputProps={{ min: 1 }}
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary">
            {t('admin.settings.termsAndConditions')}
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={6}
            label={t('admin.settings.termsLabel')}
            value={settings.terms_and_conditions || ''}
            onChange={(e) => handleChange('terms_and_conditions', e.target.value)}
            helperText={t('admin.settings.termsHelper')}
          />
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 3 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('admin.settings.saving') : t('admin.settings.saveSettings')}
        </Button>
      </CardActions>
    </Card>
  )
}

export default ResaleSettingsPage
