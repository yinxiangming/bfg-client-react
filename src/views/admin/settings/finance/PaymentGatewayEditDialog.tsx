'use client'

import { useState, useEffect, useMemo } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import SchemaConfigEditor, { type ConfigSchema } from '@/components/config/SchemaConfigEditor'
import type {
  PaymentGateway,
  PaymentGatewayPayload,
  PaymentGatewayPluginInfo
} from '@/services/finance'

// JSON placeholders contain braces; keep as constants to avoid i18n format parsing
const LIVE_CONFIG_PLACEHOLDER =
  '{"secret_key": "sk_live_...", "publishable_key": "pk_live_...", "webhook_secret": "whsec_..."}'
const TEST_CONFIG_PLACEHOLDER =
  '{"secret_key": "sk_test_...", "publishable_key": "pk_test_...", "webhook_secret": "whsec_..."}'

type PaymentGatewayEditDialogProps = {
  open: boolean
  gateway: PaymentGateway | null
  gatewayPlugins?: PaymentGatewayPluginInfo[]
  onClose: () => void
  onSave: (data: PaymentGatewayPayload) => Promise<void> | void
}

const PaymentGatewayEditDialog = ({
  open,
  gateway,
  gatewayPlugins = [],
  onClose,
  onSave
}: PaymentGatewayEditDialogProps) => {
  const t = useTranslations('admin')
  const [name, setName] = useState('')
  const [gatewayType, setGatewayType] = useState('')
  const [config, setConfig] = useState<Record<string, any>>({})
  const [testConfig, setTestConfig] = useState<Record<string, any>>({})
  const [configJson, setConfigJson] = useState('{}')
  const [testConfigJson, setTestConfigJson] = useState('{}')
  const [isActive, setIsActive] = useState(true)
  const [isTestMode, setIsTestMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialGatewayType, setInitialGatewayType] = useState('')

  const selectedPlugin = useMemo(
    () => gatewayPlugins.find((p) => p.gateway_type === gatewayType),
    [gatewayPlugins, gatewayType]
  )

  const configSchema: ConfigSchema = useMemo(() => {
    if (!selectedPlugin?.config_schema) return {}
    return selectedPlugin.config_schema as ConfigSchema
  }, [selectedPlugin])

  useEffect(() => {
    if (open) {
      if (gateway) {
        setName(gateway.name)
        setGatewayType(gateway.gateway_type || '')
        setInitialGatewayType(gateway.gateway_type || '')
        const c = gateway.config || {}
        const tc = gateway.test_config || {}
        setConfig(c)
        setTestConfig(tc)
        setConfigJson(JSON.stringify(c, null, 2))
        setTestConfigJson(JSON.stringify(tc, null, 2))
        setIsActive(gateway.is_active)
        setIsTestMode(gateway.is_test_mode ?? true)
      } else {
        const firstType = gatewayPlugins.length > 0 ? gatewayPlugins[0].gateway_type : ''
        setName('')
        setGatewayType(firstType)
        setInitialGatewayType(firstType)
        setConfig({})
        setTestConfig({})
        setConfigJson('{}')
        setTestConfigJson('{}')
        setIsActive(true)
        setIsTestMode(true)
      }
    }
  }, [open, gateway, gatewayPlugins])

  useEffect(() => {
    if (open && initialGatewayType !== '' && gatewayType !== initialGatewayType) {
      setConfig({})
      setTestConfig({})
      setConfigJson('{}')
      setTestConfigJson('{}')
    }
  }, [gatewayType, initialGatewayType, open])

  const pluginOptions = useMemo(
    () =>
      gatewayPlugins.map((p) => ({
        value: p.gateway_type,
        label: p.display_name
      })),
    [gatewayPlugins]
  )

  const hasConfigSchema = Object.keys(configSchema).length > 0

  const parseJson = (str: string): Record<string, any> | null => {
    if (!str?.trim()) return {}
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert(t('settings.finance.paymentGateways.editDialog.nameRequired'))
      return
    }
    const finalConfig = hasConfigSchema ? config : parseJson(configJson)
    const finalTestConfig = hasConfigSchema ? testConfig : parseJson(testConfigJson)
    if (!hasConfigSchema) {
      if (finalConfig === null) {
        alert(t('settings.finance.paymentGateways.editDialog.liveConfigInvalid'))
        return
      }
      if (finalTestConfig === null) {
        alert(t('settings.finance.paymentGateways.editDialog.testConfigInvalid'))
        return
      }
    }
    setLoading(true)
    try {
      const payload: PaymentGatewayPayload = {
        name: name.trim(),
        gateway_type: gatewayType || pluginOptions[0]?.value || 'stripe',
        config: finalConfig ?? {},
        test_config: finalTestConfig ?? {},
        is_active: isActive,
        is_test_mode: isTestMode
      }
      await onSave(payload)
      onClose()
    } catch (err: any) {
      alert(t('settings.finance.paymentGateways.editDialog.saveFailed', { error: err?.message || err }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        {gateway
          ? t('settings.finance.paymentGateways.editDialog.titleEdit')
          : t('settings.finance.paymentGateways.editDialog.titleNew')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('settings.finance.paymentGateways.editDialog.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>{t('settings.finance.paymentGateways.editDialog.gatewayType')}</InputLabel>
                <Select
                  value={gatewayType}
                  label={t('settings.finance.paymentGateways.editDialog.gatewayType')}
                  onChange={(e) => setGatewayType(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t('settings.finance.paymentGateways.editDialog.gatewayTypePlaceholder')}</em>
                  </MenuItem>
                  {pluginOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                label={t('settings.finance.paymentGateways.editDialog.active')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={<Switch checked={isTestMode} onChange={(e) => setIsTestMode(e.target.checked)} />}
                label={t('settings.finance.paymentGateways.editDialog.testMode')}
              />
            </Grid>
          </Grid>

          {hasConfigSchema ? (
            <>
              <Divider sx={{ my: 4 }} />
              <Typography variant='h6' sx={{ mb: 3 }}>
                {t('settings.finance.paymentGateways.editDialog.pluginConfiguration')}
              </Typography>
              <Box sx={{ mb: 4 }}>
                <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
                  {t('settings.finance.paymentGateways.editDialog.liveConfig')}
                </Typography>
                <SchemaConfigEditor schema={configSchema} value={config} onChange={setConfig} />
              </Box>
              <Box>
                <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
                  {t('settings.finance.paymentGateways.editDialog.testConfig')}
                </Typography>
                <SchemaConfigEditor schema={configSchema} value={testConfig} onChange={setTestConfig} />
              </Box>
            </>
          ) : (
            <>
              <Divider sx={{ my: 4 }} />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    label={t('settings.finance.paymentGateways.editDialog.liveConfig')}
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                    placeholder={LIVE_CONFIG_PLACEHOLDER}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    label={t('settings.finance.paymentGateways.editDialog.testConfig')}
                    value={testConfigJson}
                    onChange={(e) => setTestConfigJson(e.target.value)}
                    placeholder={TEST_CONFIG_PLACEHOLDER}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common.actions.cancel')}
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? t('common.states.saving') : t('common.actions.update')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentGatewayEditDialog
