'use client'

// i18n Imports
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { bfgApi } from '@/utils/api'
import { getWorkspaceSettings, updateDeliverySettings, type DeliverySettingsPayload } from '@/services/settings'

const buildDeliveryFormSchema = (t: any): FormSchema => ({
  title: t('settings.delivery.deliverySettings.title'),
  fields: [
    {
      field: 'default_warehouse_id',
      label: t('settings.delivery.deliverySettings.fields.defaultWarehouse'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.warehouses(),
      optionLabelTemplate: '{{name}} ({{code}})',
      searchable: true,
      searchParam: 'q'
    },
    {
      field: 'default_carrier_id',
      label: t('settings.delivery.deliverySettings.fields.defaultCarrier'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.carriers(),
      optionLabelTemplate: '{{name}} ({{code}})',
      searchable: true,
      searchParam: 'q'
    },
    {
      field: 'free_shipping_threshold',
      label: t('settings.delivery.deliverySettings.fields.freeShippingThreshold'),
      type: 'number',
      required: false
    },
    {
      field: 'default_packaging_type_id',
      label: t('settings.delivery.deliverySettings.fields.defaultPackagingType'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.packagingTypes(),
      optionLabelTemplate: '{{name}} {{length}}x{{width}}x{{height}}cm',
      searchable: true,
      searchParam: 'q',
      newline: true
    }
  ]
})

const DeliverySettingsTab = () => {
  const t = useTranslations('admin')
  const deliveryFormSchema = useMemo(() => buildDeliveryFormSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<Array<DeliverySettingsPayload & { id: number }>>({
    fetchFn: async () => {
      const settings = await getWorkspaceSettings()
      const delivery = (settings.custom_settings as any)?.delivery || {}
      return [
        {
          id: settings.id,
          default_warehouse_id: delivery.default_warehouse_id ?? undefined,
          default_carrier_id: delivery.default_carrier_id ?? undefined,
          free_shipping_threshold: delivery.free_shipping_threshold ?? 0,
          default_packaging_type_id: delivery.default_packaging_type_id ?? undefined
        }
      ]
    }
  })

  const handleSubmit = async (payload: DeliverySettingsPayload) => {
    try {
      const settingsId = data && data[0]?.id
      if (!settingsId) {
        alert(t('settings.delivery.deliverySettings.errors.noWorkspaceSettings'))
        return
      }
      await updateDeliverySettings(settingsId, payload)
      await refetch()
      alert(t('settings.delivery.deliverySettings.snackbar.saved'))
    } catch (err: any) {
      alert(t('settings.delivery.deliverySettings.errors.saveFailed', { error: err.message }))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    )
  }

  const initial = data && data[0] ? data[0] : undefined

  return (
    <Box sx={{ p: 4 }}>
      <SchemaForm schema={deliveryFormSchema} initialData={initial} onSubmit={handleSubmit} onCancel={() => {}} />
    </Box>
  )
}

export default DeliverySettingsTab

