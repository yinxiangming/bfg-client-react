'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import SchemaTable from '@/components/schema/SchemaTable'
import StatusBadge from '@/components/schema/StatusBadge'
import type { ListSchema, SchemaAction, SchemaFilter } from '@/types/schema'
import { usePagedData } from '@/hooks/usePagedData'
import {
  getOrdersPage, getOrder, deleteOrder, updateOrder,
  ORDER_STATUSES, PAYMENT_STATUSES,
  type Order, type OrderItemSummary
} from '@/services/store'
import { getWorkspaceSettings } from '@/services/settings'
import { formatCurrency, formatDate } from '@/utils/format'
import { bfgApi } from '@/utils/api'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@/components/ui/TextField'
import OrderPackagesModal from '@/views/admin/store/orders/list/OrderPackagesModal'
import CustomerQuickViewDialog from '@/views/admin/store/orders/list/CustomerQuickViewDialog'
import PaymentProofDialog from '@/views/admin/store/orders/list/PaymentProofDialog'
import CreateOrderModal from '@/views/admin/store/orders/list/CreateOrderModal'

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'primary',
  ready_for_pickup: 'primary',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'default'
}

const PAYMENT_COLORS: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  paid: 'success',
  failed: 'error',
  refunded: 'default'
}

type PopoverState = { orderId: number | null; anchorEl: HTMLElement | null }

const buildOrdersSchema = (
  t: any,
  currency: string,
  openLogisticsModal: (orderId: number) => void,
  openStatusPopover: (orderId: number, anchorEl: HTMLElement) => void,
  openPaymentPopover: (orderId: number, anchorEl: HTMLElement) => void,
  openCustomer: (customerId: number) => void,
  openProof: (orderId: number) => void
): ListSchema => ({
  title: t('orders.listPage.schema.title'),
  columns: [
    {
      field: 'order_number',
      label: t('orders.listPage.schema.columns.orderNo'),
      type: 'string',
      sortable: true,
      link: 'edit',
      // Holds the order number plus one line per item. Product names run to 40+
      // CJK characters, so this column has to be capped or it eats the table.
      width: 300,
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
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {/* Fixed box either way, so the product names stay aligned
                        whether or not a line has an image. */}
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {i.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={i.image}
                          alt=''
                          loading='lazy'
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <i className='tabler-photo' style={{ fontSize: '1rem', opacity: 0.4 }} />
                      )}
                    </Box>
                    <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.4 }}>
                      {i.product_name} × {i.quantity}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            {note && (
              <Typography variant='body2' color='text.secondary' sx={{ fontStyle: 'italic' }} component='span' display='block'>
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
      width: 150,
      render: (value: any, row: any) => {
        const label = row.customer_name || value || '-'
        const customerId = typeof row.customer === 'object' ? row.customer?.id : row.customer
        if (!customerId || label === '-') return label
        // Who is this, and how do I reach them — the question staff ask most
        // often about a row, and it used to mean leaving the list to answer.
        return (
          <Box
            component='span'
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openCustomer(Number(customerId)) }}
            sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
          >
            {label}
          </Box>
        )
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
        const label = status ? t(`orders.status.${status}`) : '-'
        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          if (row?.id != null) openStatusPopover(row.id, e.currentTarget as HTMLElement)
        }
        return (
          <Box component='span' onClick={handleClick} sx={{ cursor: 'pointer' }}>
            <StatusBadge label={label} color={STATUS_COLORS[status] || 'default'} />
          </Box>
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
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Box component='span' onClick={handleClick} sx={{ cursor: 'pointer' }}>
              <StatusBadge label={label} color={PAYMENT_COLORS[status] || 'default'} />
            </Box>
            {/* A bank-transfer shopper uploads a screenshot and then waits for
                someone to look at it. Without a mark here the only way to find
                those orders was to open them one at a time. It does not claim
                the order is paid — that is still a human's call. */}
            {row?.has_payment_proof && (
              <Tooltip title={t('orders.listPage.schema.columns.paymentProof')}>
                <IconButton
                  size='small'
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (row?.id != null) openProof(row.id) }}
                  aria-label={t('orders.listPage.schema.columns.paymentProof')}
                >
                  <i className='tabler-photo-check' style={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      }
    },
    {
      field: 'fulfillment_method',
      label: t('orders.listPage.schema.columns.fulfillment'),
      type: 'select',
      sortable: true,
      width: 110,
      render: (value: any, row: Order) => {
        const method = (typeof value === 'string' ? value : row?.fulfillment_method) || ''
        if (!method) return '-'
        // The Logistics column was one icon opening one dialog, and it cost a
        // whole column to say so. The badge that names the method is the
        // obvious thing to click to change how it is fulfilled.
        const count = row?.packages_count ?? 0
        const withLogistics = (node: React.ReactNode) => (
          <Box
            component='span'
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (row?.id != null) openLogisticsModal(row.id) }}
            sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            {node}
            {count > 0 && (
              <Typography variant='caption' color='text.secondary'>
                {t('orders.listPage.schema.columns.packagesCount', { count })}
              </Typography>
            )}
          </Box>
        )
        const badge = (
          <StatusBadge
            label={
              method === 'pickup'
                ? t('orders.listPage.schema.columns.fulfillmentPickup')
                : t('orders.listPage.schema.columns.fulfillmentShipping')
            }
            color={method === 'pickup' ? 'warning' : 'info'}
          />
        )
        // Which point to stage the order at is what a picker needs, but naming
        // it inline would widen the column for every shipping row too.
        if (method === 'pickup' && row?.pickup_point_name) {
          return withLogistics(<Tooltip title={row.pickup_point_name}><span>{badge}</span></Tooltip>)
        }
        return withLogistics(badge)
      }
    },
    {
      field: 'created_at',
      label: t('orders.listPage.schema.columns.createdAt'),
      type: 'datetime',
      sortable: true,
      width: 150,
      render: (value: any) => (value ? formatDate(value, 'yyyy-MM-dd HH:mm') : '-')
    }
  ],
  filters: [
    {
      field: 'status',
      label: t('orders.listPage.filters.status.label'),
      type: 'select',
      filterMode: 'api',
      options: ORDER_STATUSES.map(value => ({ value, label: t(`orders.status.${value}`) }))
    },
    {
      field: 'payment_status',
      label: t('orders.listPage.filters.paymentStatus.label'),
      type: 'select',
      filterMode: 'api',
      options: PAYMENT_STATUSES.map(value => ({ value, label: t(`orders.paymentStatus.${value}`) }))
    },
    {
      field: 'has_payment_proof',
      label: t('orders.listPage.filters.paymentProof.label'),
      type: 'select',
      filterMode: 'api',
      options: [
        { value: '1', label: t('orders.listPage.filters.paymentProof.yes') },
        { value: '0', label: t('orders.listPage.filters.paymentProof.no') }
      ]
    },
    {
      field: 'store',
      label: t('orders.listPage.filters.store.label'),
      type: 'select',
      filterMode: 'api',
      optionsSource: 'api',
      optionsApi: bfgApi.stores(),
      optionsValueField: 'id',
      optionsLabelField: 'name'
    },
    {
      field: 'created_range',
      label: t('orders.listPage.filters.createdTime.label'),
      type: 'daterange',
      filterMode: 'api',
      options: [
        { value: '', label: t('common.schemaTable.all') },
        { value: 'today', label: t('common.schemaTable.dateRange.today') },
        { value: 'yesterday', label: t('common.schemaTable.dateRange.yesterday') },
        { value: 'last_week', label: t('common.schemaTable.dateRange.lastWeek') },
        { value: 'custom', label: t('common.schemaTable.dateRange.selectDate') }
      ],
      dateRange: {
        startField: 'created_after',
        endField: 'created_before',
        rangeOptionValue: 'custom',
        includeTimeSwitch: true,
        defaultTimeEnabled: false
      }
    }
  ] as SchemaFilter[],
  searchFields: ['order_number', 'customer_name'],
  actions: [
    { id: 'add', label: t('orders.listPage.actions.add'), type: 'primary', scope: 'global', icon: 'tabler-plus' },
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
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false)
  const [customerDialogId, setCustomerDialogId] = useState<number | null>(null)
  const [proofDialogOrderId, setProofDialogOrderId] = useState<number | null>(null)
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
  const openCustomer = useCallback((customerId: number) => setCustomerDialogId(customerId), [])
  const openProof = useCallback((orderId: number) => setProofDialogOrderId(orderId), [])
  const openPaymentPopover = useCallback((orderId: number, anchorEl: HTMLElement) => {
    setPaymentPopover({ orderId, anchorEl })
  }, [])
  const ordersSchema = useMemo(
    () => buildOrdersSchema(t, currency, openLogisticsModal, openStatusPopover, openPaymentPopover, openCustomer, openProof),
    [t, currency, openLogisticsModal, openStatusPopover, openPaymentPopover, openCustomer, openProof]
  )

  const [apiFilters, setApiFilters] = useState<Record<string, string>>({})
  const extraParams = useMemo(() => ({ ...apiFilters }), [apiFilters])
  const {
    items: orders,
    loading,
    error,
    serverPagination,
    onSearchChange,
    refetch,
  } = usePagedData<Order, Record<string, string>>(getOrdersPage, { extraParams })

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
      setCreateOrderModalOpen(true)
    }
  }

  if (error && !orders) {
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
      <AdminPageHeader title={t('orders.listPage.title')} subtitle={t('orders.listPage.subtitle')} />
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <SchemaTable
        schema={ordersSchema}
        data={orders || []}
        loading={loading}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getOrder(typeof id === 'string' ? parseInt(id) : id)}
        basePath='/admin/store/orders'
        filters={apiFilters}
        onFiltersChange={setApiFilters}
        serverPagination={serverPagination}
        onSearchChange={onSearchChange}
      />
      <OrderPackagesModal
        open={logisticsModalOrderId != null}
        onClose={closeLogisticsModal}
        orderId={logisticsModalOrderId}
        onSuccess={refetch}
      />
      <CreateOrderModal
        open={createOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        onSuccess={refetch}
      />
      {/* A menu, not a popover wrapping a second dropdown: the old shape made
          changing a status three clicks, two of which were opening things. */}
      <Menu
        open={Boolean(statusPopover.anchorEl)}
        anchorEl={statusPopover.anchorEl}
        onClose={() => setStatusPopover({ orderId: null, anchorEl: null })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {ORDER_STATUSES.map(value => (
          <MenuItem
            key={value}
            selected={orderForStatus?.status === value}
            disabled={statusChanging}
            onClick={() => handleStatusSelect(value)}
          >
            {t(`orders.status.${value}`)}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        open={Boolean(paymentPopover.anchorEl)}
        anchorEl={paymentPopover.anchorEl}
        onClose={() => setPaymentPopover({ orderId: null, anchorEl: null })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {PAYMENT_STATUSES.map(value => (
          <MenuItem
            key={value}
            selected={orderForPayment?.payment_status === value}
            disabled={paymentChanging}
            onClick={() => handlePaymentSelect(value)}
          >
            {t(`orders.paymentStatus.${value}`)}
          </MenuItem>
        ))}
      </Menu>
      <CustomerQuickViewDialog
        open={customerDialogId != null}
        customerId={customerDialogId}
        onClose={() => setCustomerDialogId(null)}
      />
      <PaymentProofDialog
        open={proofDialogOrderId != null}
        orderId={proofDialogOrderId}
        onClose={() => setProofDialogOrderId(null)}
      />
    </Box>
  )
}

