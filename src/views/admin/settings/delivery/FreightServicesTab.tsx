'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import {
  getFreightServices,
  getFreightService,
  deleteFreightService,
  type FreightService
} from '@/services/delivery'

const buildFreightServicesSchema = (t: any): ListSchema => ({
  title: t('settings.delivery.freightServices.tab.title'),
  columns: [
    { field: 'name', label: t('settings.delivery.freightServices.tab.columns.name'), type: 'string', sortable: true, link: 'edit' },
    { field: 'code', label: t('settings.delivery.freightServices.tab.columns.code'), type: 'string', sortable: true },
    { field: 'carrier_name', label: t('settings.delivery.freightServices.tab.columns.carrier'), type: 'string' },
    { field: 'base_price', label: t('settings.delivery.freightServices.tab.columns.basePrice'), type: 'currency', sortable: true },
    { field: 'price_per_kg', label: t('settings.delivery.freightServices.tab.columns.pricePerKg'), type: 'currency', sortable: true },
    {
      field: 'estimated_days_min',
      label: t('settings.delivery.freightServices.tab.columns.etaDays'),
      type: 'number',
      render: (_v, row) => `${row.estimated_days_min}-${row.estimated_days_max}`
    },
    { field: 'is_active', label: t('settings.delivery.freightServices.tab.columns.status'), type: 'select', sortable: true }
  ],
  searchFields: ['name', 'code', 'carrier_name'],
  actions: [
    { id: 'add', label: t('settings.delivery.freightServices.tab.actions.newService'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
    { id: 'edit', label: t('settings.delivery.freightServices.tab.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'delete',
      label: t('settings.delivery.freightServices.tab.actions.delete'),
      type: 'danger',
      scope: 'row',
      confirm: t('settings.delivery.freightServices.tab.actions.confirmDelete')
    }
  ]
})

const FreightServicesTab = () => {
  const router = useRouter()
  const t = useTranslations('admin')
  const freightServicesSchema = useMemo(() => buildFreightServicesSchema(t), [t])

  const { data, loading, error, refetch } = useApiData<FreightService[]>({
    fetchFn: async () => {
      const result = await getFreightServices()
      if (Array.isArray(result)) return result
      if (result && typeof result === 'object' && 'results' in result && Array.isArray((result as any).results)) {
        return (result as any).results
      }
      return []
    }
  })

  const handleActionClick = async (action: SchemaAction, item: FreightService | {}) => {
    if (action.id === 'add') {
      router.push('/admin/settings/delivery/freight-services/new')
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      router.push(`/admin/settings/delivery/freight-services/${(item as FreightService).id}/edit`)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteFreightService((item as FreightService).id)
        await refetch()
      } catch (err: any) {
        alert(t('settings.delivery.freightServices.tab.errors.deleteFailed', { error: err.message }))
      }
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">{t('settings.delivery.freightServices.tab.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<i className="tabler-plus" style={{ fontSize: '1rem' }} />}
          onClick={() => router.push('/admin/settings/delivery/freight-services/new')}
        >
          {t('settings.delivery.freightServices.tab.actions.newService')}
        </Button>
      </Box>
      <SchemaTable
        schema={freightServicesSchema}
        data={data || []}
        onActionClick={handleActionClick}
        basePath="/admin/settings/delivery/freight-services"
        fetchDetailFn={(id) => getFreightService(typeof id === 'string' ? parseInt(id) : id)}
      />
    </Box>
  )
}

export default FreightServicesTab

