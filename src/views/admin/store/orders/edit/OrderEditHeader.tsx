'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { Order } from '@/services/store'
import { getIntlLocale } from '@/utils/format'

type OrderEditHeaderProps = {
  order: Order & { items?: Array<{ id: number; quantity: number; product_name?: string }> }
  onBack?: () => void
  onShip?: () => void
  onRefund?: () => Promise<void>
  onRelist?: () => Promise<void>
  onCreateReturn?: (payload: {
    reason_category?: string
    customer_note?: string
    restock_action: 'no_restock' | 'restock' | 'damage'
  }) => Promise<void>
  onCancelOrder?: (reason?: string) => Promise<void>
  onStatusChange?: (status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled') => Promise<void>
  onPaymentStatusChange?: (status: 'pending' | 'paid' | 'failed') => Promise<void>
}

const OrderEditHeader = ({
  order,
  onBack,
  onShip,
  onRefund,
  onRelist,
  onCreateReturn,
  onCancelOrder,
  onStatusChange,
  onPaymentStatusChange
}: OrderEditHeaderProps) => {
  const router = useRouter()
  const t = useTranslations('admin')
  const [statusEditAnchor, setStatusEditAnchor] = useState<HTMLElement | null>(null)
  const [paymentStatusEditAnchor, setPaymentStatusEditAnchor] = useState<HTMLElement | null>(null)
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null)
  const [statusChanging, setStatusChanging] = useState(false)
  const [paymentStatusChanging, setPaymentStatusChanging] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [returnReasonCategory, setReturnReasonCategory] = useState('')
  const [returnCustomerNote, setReturnCustomerNote] = useState('')
  const [returnRestockAction, setReturnRestockAction] = useState<'no_restock' | 'restock' | 'damage'>('restock')

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push(`/admin/store/orders/${order.id}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(getIntlLocale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'secondary' | 'default'> = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      paid: 'success',
      completed: 'success',
      cancelled: 'error',
      refunded: 'secondary'
    }
    return colorMap[status] || 'default'
  }

  const getPaymentColor = (status: string) => {
    const colorMap: Record<string, 'warning' | 'success' | 'error' | 'secondary' | 'default'> = {
      pending: 'warning',
      paid: 'success',
      failed: 'error',
      refunded: 'secondary'
    }
    return colorMap[status] || 'default'
  }

  const formatStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1)

  const getOrderStatusLabel = (status: string) => {
    if (status === 'shipped' && order.fulfillment_method === 'pickup') {
      return t('orders.status.readyToPickup')
    }
    const key = `orders.status.${status}`
    const has = (t as any).has ? (t as any).has(key) : true
    return has ? t(key as any) : formatStatusLabel(status)
  }

  const getPaymentStatusLabel = (status: string) => {
    const key = `orders.paymentStatus.${status}`
    const has = (t as any).has ? (t as any).has(key) : true
    return has ? t(key as any) : formatStatusLabel(status)
  }

  const runAction = async (name: string, fn: () => Promise<void>) => {
    setSubmitError(null)
    setBusyAction(name)
    try {
      await fn()
      setActionsAnchor(null)
    } catch (err: any) {
      setSubmitError(err?.message || t('orders.editHeader.errors.actionFailed'))
      throw err
    } finally {
      setBusyAction(null)
    }
  }

  const handleStatusChange = async (newStatus: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled') => {
    if (newStatus === order.status || !onStatusChange) {
      setStatusEditAnchor(null)
      return
    }
    setStatusChanging(true)
    try {
      await onStatusChange(newStatus)
      setStatusEditAnchor(null)
    } finally {
      setStatusChanging(false)
    }
  }

  const handlePaymentStatusChange = async (newStatus: 'pending' | 'paid' | 'failed') => {
    if (newStatus === order.payment_status || !onPaymentStatusChange) {
      setPaymentStatusEditAnchor(null)
      return
    }
    setPaymentStatusChanging(true)
    try {
      await onPaymentStatusChange(newStatus)
      setPaymentStatusEditAnchor(null)
    } finally {
      setPaymentStatusChanging(false)
    }
  }

  const canShip = !!onShip && !['shipped', 'completed', 'cancelled'].includes(order.status)
  const canCancel = !!onCancelOrder && !['cancelled', 'completed', 'refunded'].includes(order.status)
  const canRefund = !!onRefund && !['refunded', 'cancelled'].includes(order.status)
  const canRelist = !!onRelist
  const canReturn = !!onCreateReturn && !!order.items?.length && !['cancelled'].includes(order.status)

  const submitCancel = async () => {
    if (!onCancelOrder) return
    await runAction('cancel', async () => {
      await onCancelOrder(cancelReason.trim() || undefined)
      setCancelDialogOpen(false)
      setCancelReason('')
    })
  }

  const submitReturn = async () => {
    if (!onCreateReturn) return
    await runAction('return', async () => {
      await onCreateReturn({
        reason_category: returnReasonCategory.trim() || undefined,
        customer_note: returnCustomerNote.trim() || undefined,
        restock_action: returnRestockAction
      })
      setReturnDialogOpen(false)
      setReturnReasonCategory('')
      setReturnCustomerNote('')
      setReturnRestockAction('restock')
    })
  }

  return (
    <Box>
      {submitError && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box>
          <Typography variant='h5'>
            {t('orders.editHeader.orderTitle', { orderNumber: order.order_number })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              {t('orders.editHeader.orderStatusLabel')}:
            </Typography>
            <Chip
              label={getOrderStatusLabel(order.status)}
              color={getStatusColor(order.status)}
              variant='filled'
              size='medium'
              onClick={onStatusChange ? (e) => setStatusEditAnchor(e.currentTarget as HTMLElement) : undefined}
              sx={onStatusChange ? { cursor: 'pointer' } : {}}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              {t('orders.editHeader.paymentStatusLabel')}:
            </Typography>
            <Chip
              label={getPaymentStatusLabel(order.payment_status)}
              color={getPaymentColor(order.payment_status)}
              variant='filled'
              size='medium'
              onClick={onPaymentStatusChange ? (e) => setPaymentStatusEditAnchor(e.currentTarget as HTMLElement) : undefined}
              sx={onPaymentStatusChange ? { cursor: 'pointer' } : {}}
            />
          </Box>

          {canShip && (
            <Button
              variant='contained'
              onClick={() => onShip?.()}
              disabled={busyAction !== null}
            >
              {t('orders.editHeader.actions.ship')}
            </Button>
          )}

          <Button
            variant='outlined'
            onClick={(e) => setActionsAnchor(e.currentTarget)}
            disabled={busyAction !== null || (!canCancel && !canRefund && !canReturn && !canRelist)}
          >
            {t('orders.editHeader.actions.more')}
          </Button>

          <Button variant='text' onClick={handleBack}>
            {t('common.actions.back')}
          </Button>
        </Box>
      </Box>
      {order.created_at && (
        <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.875rem' }}>
          {t('orders.editHeader.createdAt', { date: formatDate(order.created_at) })}
        </Typography>
      )}

      <Popover
        open={Boolean(statusEditAnchor)}
        anchorEl={statusEditAnchor}
        onClose={() => setStatusEditAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 150 }}>
          <FormControl fullWidth size='small' disabled={statusChanging}>
            <Select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value as 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled')}
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
        open={Boolean(paymentStatusEditAnchor)}
        anchorEl={paymentStatusEditAnchor}
        onClose={() => setPaymentStatusEditAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 150 }}>
          <FormControl fullWidth size='small' disabled={paymentStatusChanging}>
            <Select
              value={order.payment_status}
              onChange={(e) => handlePaymentStatusChange(e.target.value as 'pending' | 'paid' | 'failed')}
            >
              <MenuItem value='pending'>{t('orders.paymentStatus.pending')}</MenuItem>
              <MenuItem value='paid'>{t('orders.paymentStatus.paid')}</MenuItem>
              <MenuItem value='failed'>{t('orders.paymentStatus.failed')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Popover>

      <Menu
        open={Boolean(actionsAnchor)}
        anchorEl={actionsAnchor}
        onClose={() => setActionsAnchor(null)}
      >
        {canCancel && <MenuItem onClick={() => { setActionsAnchor(null); setCancelDialogOpen(true) }}>{t('orders.editHeader.actions.cancelOrder')}</MenuItem>}
        {canRefund && <MenuItem onClick={() => onRefund && runAction('refund', onRefund)}>{busyAction === 'refund' ? t('orders.editHeader.actions.refunding') : t('orders.editHeader.actions.refund')}</MenuItem>}
        {canReturn && <MenuItem onClick={() => { setActionsAnchor(null); setReturnDialogOpen(true) }}>{t('orders.editHeader.actions.return')}</MenuItem>}
        {canRelist && <MenuItem onClick={() => onRelist && runAction('relist', onRelist)}>{busyAction === 'relist' ? t('orders.editHeader.actions.relisting') : t('orders.editHeader.actions.relist')}</MenuItem>}
      </Menu>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('orders.editHeader.dialogs.cancelTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t('orders.editHeader.dialogs.cancelReason')}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>{t('common.actions.cancel')}</Button>
          <Button color='error' variant='contained' onClick={submitCancel} disabled={busyAction !== null}>
            {t('orders.editHeader.actions.cancelOrder')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('orders.editHeader.dialogs.returnTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('orders.editHeader.dialogs.returnCategory')}
            value={returnReasonCategory}
            onChange={(e) => setReturnReasonCategory(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <FormControl fullWidth size='small' sx={{ mb: 2 }}>
            <Select value={returnRestockAction} onChange={(e) => setReturnRestockAction(e.target.value as 'no_restock' | 'restock' | 'damage')}>
              <MenuItem value='restock'>{t('orders.editHeader.restock.restock')}</MenuItem>
              <MenuItem value='no_restock'>{t('orders.editHeader.restock.noRestock')}</MenuItem>
              <MenuItem value='damage'>{t('orders.editHeader.restock.damage')}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t('orders.editHeader.dialogs.returnNote')}
            value={returnCustomerNote}
            onChange={(e) => setReturnCustomerNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>{t('common.actions.cancel')}</Button>
          <Button variant='contained' onClick={submitReturn} disabled={busyAction !== null}>
            {t('orders.editHeader.actions.return')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default OrderEditHeader
