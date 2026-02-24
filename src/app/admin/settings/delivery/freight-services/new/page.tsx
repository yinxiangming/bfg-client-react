'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

import SchemaForm from '@/components/schema/SchemaForm'
import type { FormSchema } from '@/types/schema'
import { bfgApi } from '@/utils/api'
import {
  createFreightService,
  type FreightServicePayload
} from '@/services/delivery'

const buildFreightServiceFormSchema = (t: (key: string) => string): FormSchema => ({
  title: t('settings.delivery.freightServices.editDialog.title'),
  fields: [
    { field: 'name', label: t('settings.delivery.freightServices.editDialog.fields.name'), type: 'string', required: true },
    { field: 'code', label: t('settings.delivery.freightServices.editDialog.fields.code'), type: 'string', required: true },
    {
      field: 'carrier',
      label: t('settings.delivery.freightServices.editDialog.fields.carrier'),
      type: 'select',
      optionsSource: 'api',
      optionsApi: bfgApi.carriers(),
      optionLabelTemplate: '{{name}} ({{code}})',
      searchable: true,
      searchParam: 'q',
      required: true
    },
    { field: 'description', label: t('settings.delivery.freightServices.editDialog.fields.description'), type: 'textarea' },
    { field: 'base_price', label: t('settings.delivery.freightServices.editDialog.fields.basePrice'), type: 'number', required: true },
    { field: 'price_per_kg', label: t('settings.delivery.freightServices.editDialog.fields.pricePerKg'), type: 'number', required: true },
    { field: 'estimated_days_min', label: t('settings.delivery.freightServices.editDialog.fields.etaMinDays'), type: 'number', required: true },
    { field: 'estimated_days_max', label: t('settings.delivery.freightServices.editDialog.fields.etaMaxDays'), type: 'number', required: true },
    { field: 'order', label: t('settings.delivery.freightServices.editDialog.fields.order'), type: 'number', defaultValue: 100 },
    { field: 'is_active', label: t('settings.delivery.freightServices.editDialog.fields.active'), type: 'boolean', defaultValue: true, newline: true }
  ]
})

export default function FreightServiceNewPage() {
  const router = useRouter()
  const t = useTranslations('admin')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  const schema = useMemo(() => buildFreightServiceFormSchema(t), [t])

  const handleSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    try {
      const payload: FreightServicePayload = {
        name: String(data.name ?? ''),
        code: String(data.code ?? ''),
        carrier: Number(data.carrier),
        description: data.description ? String(data.description) : undefined,
        base_price: Number(data.base_price ?? 0),
        price_per_kg: Number(data.price_per_kg ?? 0),
        estimated_days_min: Number(data.estimated_days_min ?? 1),
        estimated_days_max: Number(data.estimated_days_max ?? 7),
        order: Number(data.order ?? 100),
        is_active: Boolean(data.is_active ?? true)
      }
      const created = await createFreightService(payload)
      setSnackbar({ open: true, message: t('settings.delivery.freightServices.tab.created'), severity: 'success' })
      setTimeout(() => router.push(`/admin/settings/delivery/freight-services/${created.id}/edit`), 1000)
    } catch (err: unknown) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed to create', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => router.push('/admin/settings/delivery')

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        {t('settings.delivery.freightServices.editDialog.title')} — New
      </Typography>
      <Card>
        <CardContent>
          <SchemaForm
            schema={schema}
            initialData={{
              base_price: 0,
              price_per_kg: 0,
              estimated_days_min: 1,
              estimated_days_max: 7,
              order: 100,
              is_active: true
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </CardContent>
      </Card>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
