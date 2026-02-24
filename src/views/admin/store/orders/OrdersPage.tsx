'use client'

import { useMemo } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction, SchemaFilter } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { getOrders, getOrder, deleteOrder, type Order } from '@/services/store'

const buildOrdersSchema = (t: any): ListSchema => ({
  title: t('orders.listPage.schema.title'),
  columns: [
    {
      field: 'order_number',
      label: t('orders.listPage.schema.columns.orderNo'),
      type: 'string',
      sortable: true,
      link: 'edit',
      render: (value: any) => value || '-'
    },
    {
      field: 'customer',
      label: t('orders.listPage.schema.columns.customer'),
      type: 'string',
      sortable: true,
      render: (value: any, row: any) => {
        return row.customer_name || value || '-'
      }
    },
    {
      field: 'store',
      label: t('orders.listPage.schema.columns.store'),
      type: 'string',
      render: (value: any, row: any) => {
        return row.store_name || value || '-'
      }
    },
    { field: 'total', label: t('orders.listPage.schema.columns.total'), type: 'currency', sortable: true },
    { field: 'status', label: t('orders.listPage.schema.columns.status'), type: 'select', sortable: true },
    {
      field: 'payment_status',
      label: t('orders.listPage.schema.columns.payment'),
      type: 'select',
      sortable: true,
      render: (value: any) => {
        const status = typeof value === 'string' ? value : ''
        const label =
          status === 'pending'
            ? t('orders.paymentStatus.pending')
            : status === 'paid'
              ? t('orders.paymentStatus.paid')
              : status === 'failed'
                ? t('orders.paymentStatus.failed')
                : status || '-'

        if (status === 'paid') {
          return (
            <Chip
              label={label}
              size='small'
              variant='filled'
              sx={{
                height: 24,
                fontSize: '0.8125rem',
                fontWeight: 500,
                backgroundColor: '#4caf50',
                color: '#ffffff',
                '& .MuiChip-label': { px: 1.5 }
              }}
            />
          )
        }
        return (
          <Chip
            label={label}
            size='small'
            color={status === 'pending' ? 'warning' : status === 'failed' ? 'error' : 'default'}
            variant='filled'
            sx={{
              height: 24,
              fontSize: '0.8125rem',
              fontWeight: 500,
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        )
      }
    },
    { field: 'created_at', label: t('orders.listPage.schema.columns.createdAt'), type: 'datetime', sortable: true }
  ],
  filters: [
    {
      field: 'status',
      label: t('orders.listPage.filters.status.label'),
      type: 'select',
      options: [
        { value: 'pending', label: t('orders.status.pending') },
        { value: 'paid', label: t('orders.status.paid') },
        { value: 'shipped', label: t('orders.status.shipped') },
        { value: 'completed', label: t('orders.status.completed') },
        { value: 'cancelled', label: t('orders.status.cancelled') }
      ]
    },
    {
      field: 'payment_status',
      label: t('orders.listPage.filters.paymentStatus.label'),
      type: 'select',
      options: [
        { value: 'pending', label: t('orders.paymentStatus.pending') },
        { value: 'paid', label: t('orders.paymentStatus.paid') },
        { value: 'failed', label: t('orders.paymentStatus.failed') }
      ]
    }
  ] as SchemaFilter[],
  searchFields: ['order_number', 'customer_name'],
  actions: [
    { id: 'export_excel', label: t('orders.listPage.actions.exportExcel'), type: 'primary', scope: 'global', icon: 'tabler-file-excel' },
    { id: 'view', label: t('orders.listPage.actions.view'), type: 'secondary', scope: 'row' },
    { id: 'edit', label: t('orders.listPage.actions.edit'), type: 'secondary', scope: 'row' },
    {
      id: 'cancel',
      label: t('orders.listPage.actions.cancel'),
      type: 'danger',
      scope: 'row',
      confirm: t('orders.listPage.actions.confirmCancel')
    },
    { id: 'ship', label: t('orders.listPage.actions.ship'), type: 'primary', scope: 'row', icon: 'tabler-truck' }
  ]
})

export default function OrdersPage() {
  const t = useTranslations('admin')
  const ordersSchema = useMemo(() => buildOrdersSchema(t), [t])

  const { data: orders, loading, error, refetch } = useApiData<Order[]>({
    fetchFn: getOrders
  })

  const handleActionClick = async (action: SchemaAction, item: Order | {}) => {
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteOrder(item.id)
        await refetch()
      } catch (err: any) {
        alert(t('orders.listPage.messages.deleteFailed', { error: err.message }))
      }
    } else if (action.id === 'cancel' && 'id' in item) {
      // TODO: Implement cancel order
      alert(t('orders.listPage.messages.cancelTodo'))
    } else if (action.id === 'ship' && 'id' in item) {
      // TODO: Implement ship order
      alert(t('orders.listPage.messages.shipTodo'))
    } else if (action.id === 'export_excel') {
      // TODO: Implement export excel
      alert(t('orders.listPage.messages.exportTodo'))
    } else if ((action.id === 'edit' || action.id === 'view') && 'id' in item) {
      window.location.href = `/admin/store/orders/${item.id}${action.id === 'edit' ? '/edit' : ''}`
    } else if (action.id === 'add') {
      window.location.href = '/admin/store/orders/new'
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
      <Box>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 4 }}>
        {t('orders.listPage.title')}
      </Typography>
      <SchemaTable
        schema={ordersSchema}
        data={orders || []}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getOrder(typeof id === 'string' ? parseInt(id) : id)}
        basePath='/admin/store/orders'
      />
    </Box>
  )
}

