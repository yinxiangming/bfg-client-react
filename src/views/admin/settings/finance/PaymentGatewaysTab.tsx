'use client'

import { useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import PaymentGatewayEditDialog from './PaymentGatewayEditDialog'
import {
  getPaymentGateways,
  getPaymentGateway,
  getPaymentGatewayPlugins,
  createPaymentGateway,
  updatePaymentGateway,
  deletePaymentGateway,
  type PaymentGateway,
  type PaymentGatewayPayload,
  type PaymentGatewayPluginInfo
} from '@/services/finance'

const buildGatewaysSchema = (t: any): ListSchema => ({
  title: t('settings.finance.paymentGateways.schema.title'),
  columns: [
    { field: 'name', label: t('settings.finance.paymentGateways.schema.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'gateway_type', label: t('settings.finance.paymentGateways.schema.type'), type: 'select', sortable: true },
    {
      field: 'is_test_mode',
      label: t('settings.finance.paymentGateways.schema.mode'),
      type: 'select',
      render: (value) => (value ? t('settings.finance.paymentGateways.schema.modeTest') : t('settings.finance.paymentGateways.schema.modeLive'))
    },
    { field: 'is_active', label: t('settings.finance.paymentGateways.schema.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name'],
  actions: [
    { id: 'add', label: t('settings.finance.paymentGateways.actions.newGateway'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.finance.paymentGateways.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.finance.paymentGateways.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.finance.paymentGateways.actions.confirmDelete')
    }
  ]
})

const PaymentGatewaysTab = () => {
  const t = useTranslations('admin')
  const gatewaysSchema = buildGatewaysSchema(t)
  const { data: plugins, loading: pluginsLoading } = useApiData<PaymentGatewayPluginInfo[]>({
    fetchFn: getPaymentGatewayPlugins
  })
  const { data, loading, error, refetch } = useApiData<PaymentGateway[]>({
    fetchFn: async () => {
      const result = await getPaymentGateways()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<PaymentGateway | null>(null)

  const handleActionClick = async (action: SchemaAction, item: PaymentGateway | {}) => {
    if (action.id === 'add') {
      setSelected(null)
      setEditOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setSelected(item as PaymentGateway)
      setEditOpen(true)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deletePaymentGateway((item as PaymentGateway).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.finance.paymentGateways.actions.deleteFailed', { error: err.message }))
      }
    }
  }

  const handleSave = async (payload: PaymentGatewayPayload) => {
    try {
      if (selected) {
        await updatePaymentGateway(selected.id, payload)
      } else {
        await createPaymentGateway(payload)
      }
      await refetch()
      setEditOpen(false)
    } catch (err: any) {
      alert(t('settings.finance.paymentGateways.editDialog.saveFailed', { error: err.message }))
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

  return (
    <>
      <SchemaTable
        schema={gatewaysSchema}
        data={data || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getPaymentGateway(typeof id === 'string' ? parseInt(id) : id)}
      />
      <PaymentGatewayEditDialog
        open={editOpen}
        gateway={selected}
        gatewayPlugins={plugins ?? []}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </>
  )
}

export default PaymentGatewaysTab
