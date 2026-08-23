'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import {
  SETTINGS_GUTTER,
  SettingsActionBar,
  SettingsSection
} from '@/components/admin/settings/SettingsSection'
import CustomTextField from '@/components/ui/TextField'
import {
  getWorkspaceSettings,
  updatePluginsSettings,
  updateShopSettings,
  type PluginsSettingsPayload,
  type ShopSettingsPayload
} from '@/services/settings'
import {
  clearStorefrontConfigCache,
  DEFAULT_STOREFRONT_DISPLAY,
  type StorefrontDisplaySettings
} from '@/utils/storefrontConfig'

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
  sku_display: StorefrontDisplaySettings['sku_display']
  stock_display: StorefrontDisplaySettings['stock_display']
  out_of_stock_policy: StorefrontDisplaySettings['out_of_stock_policy']
}

const initialShopData: ShopData = {
  sku_prefix: 'SKU-',
  barcode_prefix: 'P-',
  ...DEFAULT_STOREFRONT_DISPLAY
}

const SKU_DISPLAY_OPTIONS: StorefrontDisplaySettings['sku_display'][] = ['plain', 'full', 'hidden']
const STOCK_DISPLAY_OPTIONS: StorefrontDisplaySettings['stock_display'][] = [
  'status',
  'low_only',
  'exact',
  'hidden'
]
const OUT_OF_STOCK_OPTIONS: StorefrontDisplaySettings['out_of_stock_policy'][] = [
  'show',
  'notify',
  'backorder',
  'hide'
]

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
          barcode_prefix: shop.product_identifiers?.barcode_prefix ?? initialShopData.barcode_prefix,
          ...DEFAULT_STOREFRONT_DISPLAY,
          ...(shop.storefront_display ?? {})
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
        },
        storefront_display: {
          sku_display: shopData.sku_display,
          stock_display: shopData.stock_display,
          out_of_stock_policy: shopData.out_of_stock_policy
        }
      }

      await updatePluginsSettings(settingsId, payload)
      await updateShopSettings(settingsId, shopPayload)
      // The storefront holds its own 5-minute copy of the config; without this the
      // display settings just saved would not reach a storefront tab in this browser
      // until it expired. The server-side copy is dropped by the settings PATCH itself.
      clearStorefrontConfigCache()
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
    <>
      <Box sx={{ px: SETTINGS_GUTTER, pt: 5, pb: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600 }}>
          {t('settings.store.settings.title')}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          {t('settings.store.settings.description')}
        </Typography>
      </Box>

      <SettingsSection title={t('settings.store.settings.fields.productIdentifiers.title')}>
        <Grid container spacing={3}>
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
        </Grid>
      </SettingsSection>

      <SettingsSection title={t('settings.store.settings.fields.storefrontDisplay.title')}>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          {t('settings.store.settings.fields.storefrontDisplay.description')}
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              select
              fullWidth
              label={t('settings.store.settings.fields.storefrontDisplay.skuDisplay.label')}
              value={shopData.sku_display}
              onChange={e =>
                setShopData(prev => ({
                  ...prev,
                  sku_display: e.target.value as ShopData['sku_display']
                }))
              }
              helperText={t(
                `settings.store.settings.fields.storefrontDisplay.skuDisplay.help.${shopData.sku_display}`
              )}
            >
              {SKU_DISPLAY_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>
                  {t(`settings.store.settings.fields.storefrontDisplay.skuDisplay.options.${option}`)}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              select
              fullWidth
              label={t('settings.store.settings.fields.storefrontDisplay.stockDisplay.label')}
              value={shopData.stock_display}
              onChange={e =>
                setShopData(prev => ({
                  ...prev,
                  stock_display: e.target.value as ShopData['stock_display']
                }))
              }
              helperText={t(
                `settings.store.settings.fields.storefrontDisplay.stockDisplay.help.${shopData.stock_display}`
              )}
            >
              {STOCK_DISPLAY_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>
                  {t(`settings.store.settings.fields.storefrontDisplay.stockDisplay.options.${option}`)}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              select
              fullWidth
              label={t('settings.store.settings.fields.storefrontDisplay.outOfStock.label')}
              value={shopData.out_of_stock_policy}
              onChange={e =>
                setShopData(prev => ({
                  ...prev,
                  out_of_stock_policy: e.target.value as ShopData['out_of_stock_policy']
                }))
              }
              helperText={t(
                `settings.store.settings.fields.storefrontDisplay.outOfStock.help.${shopData.out_of_stock_policy}`
              )}
            >
              {OUT_OF_STOCK_OPTIONS.map(option => (
                <MenuItem key={option} value={option}>
                  {t(`settings.store.settings.fields.storefrontDisplay.outOfStock.options.${option}`)}
                </MenuItem>
              ))}
            </CustomTextField>
          </Grid>
        </Grid>
      </SettingsSection>

      <SettingsSection title={t('settings.store.settings.fields.productScanner.title')}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={pluginsData.product_scanner_enabled}
                  onChange={e => handleChange('product_scanner_enabled', e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant='body2'>{t('settings.store.settings.fields.productScanner.enabled.label')}</Typography>
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
      </SettingsSection>

      <SettingsActionBar>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <i className='tabler-check' />}
        >
          {saving ? t('settings.store.settings.actions.saving') : t('settings.store.settings.actions.save')}
        </Button>
      </SettingsActionBar>

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
    </>
  )
}

export default StorePluginsTab
