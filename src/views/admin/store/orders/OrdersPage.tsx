'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction, SchemaFilter } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import { getOrders, getOrder, deleteOrder, updateOrder, type Order, type OrderItemSummary } from '@/services/store'
import { getWorkspaceSettings } from '@/services/settings'
import { formatCurrency, formatDate } from '@/utils/format'
import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import OrderPackagesModal from '@/views/admin/store/orders/list/OrderPackagesModal'

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  paid: 'success',
  shipped: 'primary',
  completed: 'success',
  cancelled: 'error'
}

const PAYMENT_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  paid: 'success',
  failed: 'error'
}

type PopoverState = { orderId: number | null; anchorEl: HTMLElement | null }

const buildOrdersSchema = (
  t: any,
  currency: string,
  openLogisticsModal: (orderId: number) => void,
  openStatusPopover: (orderId: number, anchorEl: HTMLElement) => void,
  openPaymentPopover: (orderId: number, anchorEl: HTMLElement) => void
): ListSchema => ({
  title: t('orders.listPage.schema.title'),
  columns: [
    {
      field: 'order_number',
      label: t('orders.listPage.schema.columns.orderNo'),
      type: 'string',
      sortable: true,
      link: 'edit',
      render: (value: any, row: Order) => {
        const num = value || row?.order_number || '-'
        const items = (row?.items || []) as OrderItemSummary[]
        const note = row?.customer_note?.trim()
        const handleCopy = (e: React.MouseEvent) => {
          e.stopPropagation()
          navigator.clipboard.writeText(num).catch(() => {})
        }
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>
                {num}
              </Typography>
              <IconButton size='small' onClick={handleCopy} sx={{ p: 0.25 }} title={t('orders.listPage.schema.columns.copyOrderNo')}>
                <i className='tabler-copy' style={{ fontSize: '1rem' }} />
              </IconButton>
            </Box>
            {items.length > 0 && (
              <Box component='span' display='block'>
                {items.map((i, idx) => (
                  <Typography key={idx} variant='body2' color='text.secondary' sx={{ fontSize: '0.9375rem', lineHeight: 1.5 }} component='span' display='block'>
                    {i.product_name} × {i.quantity}
                  </Typography>
                ))}
              </Box>
            )}
            {note && (
              <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.9375rem', fontStyle: 'italic' }} component='span' display='block'>
                {t('orders.listPage.schema.columns.noteLabel')}: {note}
              </Typography>
            )}
          </Box>
        )
      }
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
    {
      field: 'total',
      label: t('orders.listPage.schema.columns.total'),
      type: 'currency',
      sortable: true,
      render: (value: any) => (value != null ? formatCurrency(value, currency) : '-')
    },
    {
      field: 'status',
      label: t('orders.listPage.schema.columns.status'),
      type: 'select',
      sortable: true,
      render: (value: any, row: Order) => {
        const status = (typeof value === 'string' ? value : row?.status) || ''
        const label =
          status === 'pending'
            ? t('orders.status.pending')
            : status === 'paid'
              ? t('orders.status.paid')
              : status === 'shipped'
                ? t('orders.status.shipped')
                : status === 'completed'
                  ? t('orders.status.completed')
                  : status === 'cancelled'
                    ? t('orders.status.cancelled')
                    : status || '-'
        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          if (row?.id != null) openStatusPopover(row.id, e.currentTarget as HTMLElement)
        }
        return (
          <Chip
            label={label}
            size='small'
            color={STATUS_COLORS[status] || 'default'}
            variant='filled'
            onClick={handleClick}
            sx={{
              cursor: 'pointer',
              height: 24,
              fontSize: '0.8125rem',
              fontWeight: 500,
              ...(status === 'paid' ? { backgroundColor: '#4caf50', color: '#ffffff' } : {}),
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        )
      }
    },
    {
      field: 'payment_status',
      label: t('orders.listPage.schema.columns.payment'),
      type: 'select',
      sortable: true,
      render: (value: any, row: Order) => {
        const status = (typeof value === 'string' ? value : row?.payment_status) || ''
        const label =
          status === 'pending'
            ? t('orders.paymentStatus.pending')
            : status === 'paid'
              ? t('orders.paymentStatus.paid')
              : status === 'failed'
                ? t('orders.paymentStatus.failed')
                : status || '-'
        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          if (row?.id != null) openPaymentPopover(row.id, e.currentTarget as HTMLElement)
        }
        return (
          <Chip
            label={label}
            size='small'
            color={PAYMENT_COLORS[status] || 'default'}
            variant='filled'
            onClick={handleClick}
            sx={{
              cursor: 'pointer',
              height: 24,
              fontSize: '0.8125rem',
              fontWeight: 500,
              ...(status === 'paid' ? { backgroundColor: '#4caf50', color: '#ffffff' } : {}),
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        )
      }
    },
    {
      field: 'packages_count',
      label: t('orders.listPage.schema.columns.logistics'),
      type: 'string',
      render: (value: any, row: Order) => {
        const count = row?.packages_count ?? value ?? 0
        const orderId = row?.id
        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          if (orderId != null) openLogisticsModal(orderId)
        }
        if (count > 0) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                {t('orders.listPage.schema.columns.packagesCount', { count })}
              </Typography>
              <Button size='small' variant='outlined' onClick={handleClick} startIcon={<i className='tabler-package' />}>
                {t('orders.listPage.schema.columns.manageLogistics')}
              </Button>
            </Box>
          )
        }
        return (
          <Button size='small' variant='outlined' color='primary' onClick={handleClick} startIcon={<i className='tabler-truck' />}>
            {t('orders.listPage.schema.columns.addPackages')}
          </Button>
        )
      }
    },
    {
      field: 'created_at',
      label: t('orders.listPage.schema.columns.createdAt'),
      type: 'datetime',
      sortable: true,
      render: (value: any) => (value ? formatDate(value, 'yyyy-MM-dd') : '-')
    }
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
  const [currency, setCurrency] = useState<string>('USD')
  const [logisticsModalOrderId, setLogisticsModalOrderId] = useState<number | null>(null)
  const [statusPopover, setStatusPopover] = useState<PopoverState>({ orderId: null, anchorEl: null })
  const [paymentPopover, setPaymentPopover] = useState<PopoverState>({ orderId: null, anchorEl: null })
  const [statusChanging, setStatusChanging] = useState(false)
  const [paymentChanging, setPaymentChanging] = useState(false)
  useEffect(() => {
    getWorkspaceSettings().then(settings => {
      const c = settings.custom_settings?.general?.default_currency
      if (c) setCurrency(c)
    }).catch(() => {})
  }, [])
  const openLogisticsModal = useCallback((orderId: number) => setLogisticsModalOrderId(orderId), [])
  const closeLogisticsModal = useCallback(() => setLogisticsModalOrderId(null), [])
  const openStatusPopover = useCallback((orderId: number, anchorEl: HTMLElement) => {
    setStatusPopover({ orderId, anchorEl })
  }, [])
  const openPaymentPopover = useCallback((orderId: number, anchorEl: HTMLElement) => {
    setPaymentPopover({ orderId, anchorEl })
  }, [])
  const ordersSchema = useMemo(
    () => buildOrdersSchema(t, currency, openLogisticsModal, openStatusPopover, openPaymentPopover),
    [t, currency, openLogisticsModal, openStatusPopover, openPaymentPopover]
  )

  const { data: orders, loading, error, refetch } = useApiData<Order[]>({
    fetchFn: getOrders
  })

  const orderForStatus = statusPopover.orderId != null ? orders?.find(o => o.id === statusPopover.orderId) : null
  const orderForPayment = paymentPopover.orderId != null ? orders?.find(o => o.id === paymentPopover.orderId) : null

  const handleStatusSelect = async (newStatus: string) => {
    if (statusPopover.orderId == null || orderForStatus?.status === newStatus) {
      setStatusPopover({ orderId: null, anchorEl: null })
      return
    }
    setStatusChanging(true)
    try {
      await updateOrder(statusPopover.orderId, { status: newStatus as Order['status'] })
      setStatusPopover({ orderId: null, anchorEl: null })
      await refetch()
    } catch (err) {
      console.error('Failed to update order status:', err)
    } finally {
      setStatusChanging(false)
    }
  }

  const handlePaymentSelect = async (newStatus: string) => {
    if (paymentPopover.orderId == null || orderForPayment?.payment_status === newStatus) {
      setPaymentPopover({ orderId: null, anchorEl: null })
      return
    }
    setPaymentChanging(true)
    try {
      await updateOrder(paymentPopover.orderId, { payment_status: newStatus as Order['payment_status'] })
      setPaymentPopover({ orderId: null, anchorEl: null })
      await refetch()
    } catch (err) {
      console.error('Failed to update payment status:', err)
    } finally {
      setPaymentChanging(false)
    }
  }

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
      <OrderPackagesModal
        open={logisticsModalOrderId != null}
        onClose={closeLogisticsModal}
        orderId={logisticsModalOrderId}
        onSuccess={refetch}
      />
      <Popover
        open={Boolean(statusPopover.anchorEl)}
        anchorEl={statusPopover.anchorEl}
        onClose={() => setStatusPopover({ orderId: null, anchorEl: null })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 150 }}>
          <FormControl fullWidth size='small' disabled={statusChanging}>
            <Select
              value={orderForStatus?.status ?? ''}
              onChange={(e) => handleStatusSelect(e.target.value)}
            >
              <MenuItem value='pending'>{t('orders.status.pending')}</MenuItem>
              <MenuItem value='paid'>{t('orders.status.paid')}</MenuItem>
              <MenuItem value='shipped'>{t('orders.status.shipped')}</MenuItem>
              <MenuItem value='completed'>{t('orders.status.completed')}</MenuItem>
              <MenuItem value='cancelled'>{t('orders.status.cancelled')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Popover>
      <Popover
        open={Boolean(paymentPopover.anchorEl)}
        anchorEl={paymentPopover.anchorEl}
        onClose={() => setPaymentPopover({ orderId: null, anchorEl: null })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 150 }}>
          <FormControl fullWidth size='small' disabled={paymentChanging}>
            <Select
              value={orderForPayment?.payment_status ?? ''}
              onChange={(e) => handlePaymentSelect(e.target.value)}
            >
              <MenuItem value='pending'>{t('orders.paymentStatus.pending')}</MenuItem>
              <MenuItem value='paid'>{t('orders.paymentStatus.paid')}</MenuItem>
              <MenuItem value='failed'>{t('orders.paymentStatus.failed')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Popover>
    </Box>
  )
}

