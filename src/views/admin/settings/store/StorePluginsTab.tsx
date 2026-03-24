'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import CustomTextField from '@/components/ui/TextField'
import {
  getWorkspaceSettings,
  updatePluginsSettings,
  updateShopSettings,
  type PluginsSettingsPayload,
  type ShopSettingsPayload
} from '@/services/settings'

type PluginsData = {
  product_scanner_enabled: boolean
  product_scanner_api_key: string
  product_scanner_api_url: string
}

const initialPluginsData: PluginsData = {
  product_scanner_enabled: false,
  product_scanner_api_key: '',
  product_scanner_api_url: ''
}

type ShopData = {
  sku_prefix: string
  barcode_prefix: string
}

const initialShopData: ShopData = {
  sku_prefix: 'SKU-',
  barcode_prefix: 'P-'
}

const StorePluginsTab = () => {
  const t = useTranslations('admin')
  const [settingsId, setSettingsId] = useState<number | null>(null)
  const [pluginsData, setPluginsData] = useState<PluginsData>(initialPluginsData)
  const [shopData, setShopData] = useState<ShopData>(initialShopData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const settings = await getWorkspaceSettings()
        setSettingsId(settings.id)
        const plugins = (settings.custom_settings as any)?.plugins || {}
        setPluginsData({
          product_scanner_enabled: plugins.product_scanner?.enabled ?? initialPluginsData.product_scanner_enabled,
          product_scanner_api_key: plugins.product_scanner?.api_key ?? initialPluginsData.product_scanner_api_key,
          product_scanner_api_url: plugins.product_scanner?.api_url ?? initialPluginsData.product_scanner_api_url
        })
        const shop = (settings.custom_settings as any)?.shop || {}
        setShopData({
          sku_prefix: shop.product_identifiers?.sku_prefix ?? initialShopData.sku_prefix,
          barcode_prefix: shop.product_identifiers?.barcode_prefix ?? initialShopData.barcode_prefix
        })
      } catch (err: any) {
        setError(t('settings.store.settings.errors.loadFailed', { error: err.message }))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [t])

  const handleChange = (field: keyof PluginsData, value: string | boolean) => {
    setPluginsData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!settingsId) {
      setError(t('settings.store.settings.errors.settingsIdMissing'))
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload: PluginsSettingsPayload = {
        product_scanner: {
          enabled: pluginsData.product_scanner_enabled,
          api_key: pluginsData.product_scanner_api_key,
          api_url: pluginsData.product_scanner_api_url
        }
      }

      const shopPayload: ShopSettingsPayload = {
        product_identifiers: {
          sku_prefix: shopData.sku_prefix,
          barcode_prefix: shopData.barcode_prefix
        }
      }

      await updatePluginsSettings(settingsId, payload)
      await updateShopSettings(settingsId, shopPayload)
      setSuccess(true)
    } catch (err: any) {
      setError(t('settings.store.settings.errors.saveFailed', { error: err.message }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card sx={{ boxShadow: 'none' }}>
      <CardContent sx={{ p: 6 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant='h6' sx={{ mb: 2 }}>
          {t('settings.store.settings.title')}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
          {t('settings.store.settings.description')}
        </Typography>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 2 }}>
              {t('settings.store.settings.fields.productIdentifiers.title')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label={t('settings.store.settings.fields.productIdentifiers.skuPrefix.label')}
              value={shopData.sku_prefix}
              onChange={e => setShopData(prev => ({ ...prev, sku_prefix: e.target.value }))}
              placeholder={t('settings.store.settings.fields.productIdentifiers.skuPrefix.placeholder')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              fullWidth
              label={t('settings.store.settings.fields.productIdentifiers.barcodePrefix.label')}
              value={shopData.barcode_prefix}
              onChange={e => setShopData(prev => ({ ...prev, barcode_prefix: e.target.value }))}
              placeholder={t('settings.store.settings.fields.productIdentifiers.barcodePrefix.placeholder')}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
              {t('settings.store.settings.fields.productScanner.title')}
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={pluginsData.product_scanner_enabled}
                  onChange={e => handleChange('product_scanner_enabled', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant='body1'>{t('settings.store.settings.fields.productScanner.enabled.label')}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {t('settings.store.settings.fields.productScanner.enabled.help')}
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {pluginsData.product_scanner_enabled && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label={t('settings.store.settings.fields.productScanner.apiUrl.label')}
                  value={pluginsData.product_scanner_api_url}
                  onChange={e => handleChange('product_scanner_api_url', e.target.value)}
                  placeholder={t('settings.store.settings.fields.productScanner.apiUrl.placeholder')}
                  slotProps={{
                    input: {
                      startAdornment: <i className='tabler-link' />
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label={t('settings.store.settings.fields.productScanner.apiKey.label')}
                  value={pluginsData.product_scanner_api_key}
                  onChange={e => handleChange('product_scanner_api_key', e.target.value)}
                  placeholder={t('settings.store.settings.fields.productScanner.apiKey.placeholder')}
                  slotProps={{
                    input: {
                      startAdornment: <i className='tabler-key' />
                    }
                  }}
                />
              </Grid>
            </>
          )}
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <i className='tabler-check' />}
          >
            {saving ? t('settings.store.settings.actions.saving') : t('settings.store.settings.actions.save')}
          </Button>
        </Box>

        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess(false)} severity='success' sx={{ width: '100%' }}>
            {t('settings.store.settings.snackbar.saved')}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  )
}

export default StorePluginsTab
