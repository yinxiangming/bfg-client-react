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
import Typography from '@mui/material/Typography'
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

import SchemaConfigEditor, { type ConfigSchema } from '@/components/config/SchemaConfigEditor'
import type { Carrier, CarrierPayload, CarrierPluginInfo } from '@/services/delivery'

type CarrierEditDialogProps = {
  open: boolean
  carrier: Carrier | null
  carrierPlugins?: CarrierPluginInfo[]
  onClose: () => void
  onSave: (data: CarrierPayload) => Promise<void> | void
}

const CarrierEditDialog = ({ open, carrier, carrierPlugins = [], onClose, onSave }: CarrierEditDialogProps) => {
  const t = useTranslations('admin')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [carrierType, setCarrierType] = useState('')
  const [trackingUrlTemplate, setTrackingUrlTemplate] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const [liveConfig, setLiveConfig] = useState<Record<string, any>>({})
  const [testConfig, setTestConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  // Get schema for selected plugin
  const selectedPlugin = useMemo(() => {
    return carrierPlugins.find(p => p.carrier_type === carrierType)
  }, [carrierPlugins, carrierType])

  const configSchema: ConfigSchema = useMemo(() => {
    return selectedPlugin?.config_schema || {}
  }, [selectedPlugin])

  // Track initial carrier type to detect user changes
  const [initialCarrierType, setInitialCarrierType] = useState<string>('')

  // Initialize data when dialog opens or carrier changes
  useEffect(() => {
    if (open) {
      if (carrier) {
        const type = carrier.carrier_type || ''
        setName(carrier.name)
        setCode(carrier.code)
        setCarrierType(type)
        setInitialCarrierType(type)
        setTrackingUrlTemplate(carrier.tracking_url_template || '')
        setIsActive(carrier.is_active)
        setIsTestMode(carrier.is_test_mode ?? false)
        setLiveConfig(carrier.config || {})
        setTestConfig(carrier.test_config || {})
      } else {
        setName('')
        setCode('')
        setCarrierType('')
        setInitialCarrierType('')
        setTrackingUrlTemplate('')
        setIsActive(true)
        setIsTestMode(false)
        setLiveConfig({})
        setTestConfig({})
      }
    }
  }, [open, carrier])

  // Reset configs only when user actively changes carrier_type (not on initial load)
  useEffect(() => {
    // Only reset if carrier type changed after initialization
    if (open && initialCarrierType !== '' && carrierType !== initialCarrierType) {
      setLiveConfig({})
      setTestConfig({})
    }
  }, [carrierType, initialCarrierType, open])

  const pluginOptions = useMemo(() => {
    return carrierPlugins.map(p => ({
      value: p.carrier_type,
      label: p.display_name
    }))
  }, [carrierPlugins])

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) {
      alert(t('settings.delivery.carriers.editDialog.nameRequired'))
      return
    }

    setLoading(true)
    try {
      const payload: CarrierPayload = {
        name: name.trim(),
        code: code.trim(),
        carrier_type: carrierType,
        config: liveConfig,
        test_config: testConfig,
        tracking_url_template: trackingUrlTemplate,
        is_active: isActive,
        is_test_mode: isTestMode
      }
      await onSave(payload)
    } finally {
      setLoading(false)
    }
  }

  const hasConfigSchema = Object.keys(configSchema).length > 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>{carrier ? t('settings.delivery.carriers.editDialog.titleEdit') : t('settings.delivery.carriers.editDialog.titleNew')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('settings.delivery.carriers.editDialog.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('settings.delivery.carriers.editDialog.code')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>{t('settings.delivery.carriers.editDialog.carrierType')}</InputLabel>
                <Select
                  value={carrierType}
                  label={t('settings.delivery.carriers.editDialog.carrierType')}
                  onChange={(e) => setCarrierType(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t('settings.delivery.carriers.editDialog.carrierTypePlaceholder')}</em>
                  </MenuItem>
                  {pluginOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('settings.delivery.carriers.editDialog.trackingUrlTemplate')}
                value={trackingUrlTemplate}
                onChange={(e) => setTrackingUrlTemplate(e.target.value)}
                placeholder={t('settings.delivery.carriers.editDialog.trackingUrlPlaceholder', { tracking_number: '1234567890' })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                }
                label={t('settings.delivery.carriers.editDialog.active')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isTestMode}
                    onChange={(e) => setIsTestMode(e.target.checked)}
                  />
                }
                label={t('settings.delivery.carriers.editDialog.testMode')}
              />
            </Grid>
          </Grid>

          {hasConfigSchema && (
            <>
              <Divider sx={{ my: 4 }} />
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('settings.delivery.carriers.editDialog.pluginConfiguration')}
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('settings.delivery.carriers.editDialog.liveConfig')}
                </Typography>
                <SchemaConfigEditor
                  schema={configSchema}
                  value={liveConfig}
                  onChange={setLiveConfig}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('settings.delivery.carriers.editDialog.testConfig')}
                </Typography>
                <SchemaConfigEditor
                  schema={configSchema}
                  value={testConfig}
                  onChange={setTestConfig}
                />
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common.actions.cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? t('common.states.saving') : t('common.actions.update')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CarrierEditDialog
