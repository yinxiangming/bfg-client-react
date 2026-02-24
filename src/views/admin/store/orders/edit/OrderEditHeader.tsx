'use client'

// React Imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Popover from '@mui/material/Popover'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { Order } from '@/services/store'

import { getIntlLocale } from '@/utils/format'

type OrderEditHeaderProps = {
  order: Order
  onCancel?: () => void
  onStatusChange?: (status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled') => Promise<void>
  onPaymentStatusChange?: (status: 'pending' | 'paid' | 'failed') => Promise<void>
}

const OrderEditHeader = ({ order, onCancel, onStatusChange, onPaymentStatusChange }: OrderEditHeaderProps) => {
  const router = useRouter()
  const t = useTranslations('admin')
  const [statusEditAnchor, setStatusEditAnchor] = useState<HTMLElement | null>(null)
  const [paymentStatusEditAnchor, setPaymentStatusEditAnchor] = useState<HTMLElement | null>(null)
  const [statusChanging, setStatusChanging] = useState(false)
  const [paymentStatusChanging, setPaymentStatusChanging] = useState(false)

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push(`/admin/store/orders/${order.id}`)
    }
  }

  // Format date to short format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(getIntlLocale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status color
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

  // Get payment status color
  const getPaymentColor = (status: string) => {
    const colorMap: Record<string, 'warning' | 'success' | 'error' | 'secondary' | 'default'> = {
      pending: 'warning',
      paid: 'success',
      failed: 'error',
      refunded: 'secondary'
    }
    return colorMap[status] || 'default'
  }

  // Format status label
  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getOrderStatusLabel = (status: string) => {
    const key = `orders.status.${status}`
    const has = (t as any).has ? (t as any).has(key) : true
    return has ? t(key as any) : formatStatusLabel(status)
  }

  const getPaymentStatusLabel = (status: string) => {
    const key = `orders.paymentStatus.${status}`
    const has = (t as any).has ? (t as any).has(key) : true
    return has ? t(key as any) : formatStatusLabel(status)
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
    } catch (err) {
      console.error('Failed to update status:', err)
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
    } catch (err) {
      console.error('Failed to update payment status:', err)
    } finally {
      setPaymentStatusChanging(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box>
          <Typography variant='h5'>
            {t('orders.editHeader.orderTitle', { orderNumber: order.order_number })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Status Badges */}
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
            {onStatusChange && (
              <Popover
                open={Boolean(statusEditAnchor)}
                anchorEl={statusEditAnchor}
                onClose={() => setStatusEditAnchor(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
              >
                <Box sx={{ p: 2, minWidth: 150 }}>
                  <FormControl fullWidth size='small' disabled={statusChanging}>
                    <Select
                      value={order.status}
                      onChange={(e) => {
                        const value = e.target.value as 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
                        handleStatusChange(value)
                      }}
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
            )}
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
            {onPaymentStatusChange && (
              <Popover
                open={Boolean(paymentStatusEditAnchor)}
                anchorEl={paymentStatusEditAnchor}
                onClose={() => setPaymentStatusEditAnchor(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
              >
                <Box sx={{ p: 2, minWidth: 150 }}>
                  <FormControl fullWidth size='small' disabled={paymentStatusChanging}>
                    <Select
                      value={order.payment_status}
                      onChange={(e) => {
                        const value = e.target.value as 'pending' | 'paid' | 'failed'
                        handlePaymentStatusChange(value)
                      }}
                    >
                      <MenuItem value='pending'>{t('orders.paymentStatus.pending')}</MenuItem>
                      <MenuItem value='paid'>{t('orders.paymentStatus.paid')}</MenuItem>
                      <MenuItem value='failed'>{t('orders.paymentStatus.failed')}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Popover>
            )}
          </Box>

          {order.status !== 'cancelled' && (
            <Button
              variant='outlined'
              color='error'
              onClick={handleCancel}
            >
              {t('orders.editHeader.cancelOrder')}
            </Button>
          )}
        </Box>
      </Box>
      {order.created_at && (
        <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.875rem' }}>
          {t('orders.editHeader.createdAt', { date: formatDate(order.created_at) })}
        </Typography>
      )}
    </Box>
  )
}

export default OrderEditHeader
