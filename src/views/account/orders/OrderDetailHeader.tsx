'use client'

// React Imports
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { getIntlLocale } from '@/utils/format'

// MUI Imports
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { useTheme } from '@mui/material/styles'

// Component Imports
import { Icon } from '@iconify/react'
import PayOrderDialog from '@/components/payments/PayOrderDialog'

type ThemeColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default'

type PaymentStatusType = {
  text: string
  color: ThemeColor
}

type StatusChipColorType = {
  color: ThemeColor
}

// Payment status will be translated in component
export const paymentStatusColors: { [key: string]: ThemeColor } = {
  paid: 'success',
  pending: 'warning',
  cancelled: 'secondary',
  failed: 'error',
  refunded: 'info'
}

export const statusChipColor: { [key: string]: StatusChipColorType } = {
  delivered: { color: 'success' },
  'out for delivery': { color: 'primary' },
  'ready to pickup': { color: 'info' },
  dispatched: { color: 'warning' },
  processing: { color: 'info' },
  pending: { color: 'warning' },
  cancelled: { color: 'error' },
  completed: { color: 'success' }
}

interface OrderDetailHeaderProps {
  order: any
  onCancel?: () => void
  onRefresh?: () => void
}

const OrderDetailHeader = ({ order, onCancel, onRefresh }: OrderDetailHeaderProps) => {
  const router = useRouter()
  const t = useTranslations('account.orderDetail')
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const open = Boolean(anchorEl)

  const orderNumber = order.order_number || `ORD-${order.id}`
  const orderStatusRaw = order.status || 'pending'
  const orderStatus = orderStatusRaw.toLowerCase()
  const paymentStatusValue = order.payment_status?.toLowerCase() || 'pending'
  const createdDate = order.created_at ? new Date(order.created_at) : new Date()

  // Get status color - check both with and without spaces
  const statusColorKey = orderStatusRaw.toLowerCase()
  const statusColorKeyNoSpaces = orderStatusRaw.toLowerCase().replace(/\s+/g, '')
  const statusColor = statusChipColor[statusColorKey]?.color || statusChipColor[statusColorKeyNoSpaces]?.color || 'default'
  const paymentColor = paymentStatusColors[paymentStatusValue] || 'warning'

  // Get color values for dark mode (Palette has no 'default', use grey for it)
  const getStatusBgColor = (color: ThemeColor) => {
    if (color === 'default') return isDarkMode ? theme.palette.grey[600] : theme.palette.grey[200]
    if (!isDarkMode) {
      const p = theme.palette[color as 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info']
      return (p && typeof p === 'object' && 'light' in p ? (p as { light?: string }).light : undefined) || theme.palette.grey[200]
    }
    const paletteColor = theme.palette[color as 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info']
    if (paletteColor && typeof paletteColor === 'object' && 'main' in paletteColor) {
      return paletteColor.main as string
    }
    return theme.palette.grey[600]
  }

  const getStatusTextColor = (color: ThemeColor) => {
    if (!isDarkMode) {
      if (color === 'default') return theme.palette.text.primary
      return theme.palette[color as 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info']?.dark || theme.palette.text.primary
    }
    return '#fff'
  }
  
  // Get translated payment status
  const getPaymentStatusText = (status: string) => {
    const statusKey = `status${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`
    return t(statusKey as any) || status
  }

  // Get translated order status
  const getOrderStatusText = (status: string) => {
    if (!status) return t('statusPending')
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '')
    const statusMap: { [key: string]: string } = {
      'delivered': 'statusDelivered',
      'outfordelivery': 'statusOutForDelivery',
      'readytopickup': 'statusReadyToPickup',
      'dispatched': 'statusDispatched',
      'processing': 'statusProcessing',
      'pending': 'statusPending',
      'cancelled': 'statusCancelled',
      'completed': 'statusCompleted'
    }
    const statusKey = statusMap[normalizedStatus] || `status${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`
    return t(statusKey as any) || status
  }

  // Check if order can be cancelled
  const canCancel = ['pending', 'processing'].includes(orderStatus)
  
  // Check if order needs payment
  const needsPayment = ['pending', 'failed'].includes(paymentStatusValue)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleBack = () => {
    router.push('/account/orders')
  }

  const handleCancelOrder = () => {
    handleMenuClose()
    if (onCancel) {
      onCancel()
    }
  }

  const handlePaymentSuccess = () => {
    // Refresh order data after successful payment
    if (onRefresh) {
      onRefresh()
    }
    setSnackbarOpen(true)
  }

  return (
    <>
      <PayOrderDialog
        open={payDialogOpen}
        onClose={() => setPayDialogOpen(false)}
        order={order}
        onPaymentSuccess={handlePaymentSuccess}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity='success' sx={{ width: '100%' }}>
          {t('paymentSuccessful')}
        </Alert>
      </Snackbar>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 3 }}>
      <div className='flex flex-col gap-1'>
        <Typography variant='h5' sx={{ fontWeight: 500 }}>
          {t('order')} {orderNumber}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {createdDate.toLocaleDateString(getIntlLocale(), {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}{' '}
          at {createdDate.toLocaleTimeString(getIntlLocale(), { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </div>

      <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0, alignItems: 'center' }}>
        {t('orderStatus')}:
        <Chip
          label={getOrderStatusText(orderStatusRaw)}
          size='small'
          {...(isDarkMode ? {} : { color: statusColor })}
          sx={[
            {
              fontWeight: 500,
              height: 24,
              fontSize: '0.75rem'
            },
            isDarkMode && {
              backgroundColor: getStatusBgColor(statusColor),
              color: getStatusTextColor(statusColor),
              '& .MuiChip-label': {
                color: getStatusTextColor(statusColor)
              }
            },
            !isDarkMode && {
              backgroundColor: getStatusBgColor(statusColor),
              color: getStatusTextColor(statusColor),
              '& .MuiChip-label': {
                color: getStatusTextColor(statusColor)
              }
            }
          ]}
        />
        {t('paymentStatus')}:
        {order.payment_status && (
          <Chip
            label={getPaymentStatusText(paymentStatusValue)}
            size='small'
            {...(isDarkMode ? {} : { color: paymentColor })}
            sx={[
              {
                fontWeight: 500,
                height: 24,
                fontSize: '0.75rem'
              },
              isDarkMode && {
                backgroundColor: getStatusBgColor(paymentColor),
                color: getStatusTextColor(paymentColor),
                '& .MuiChip-label': {
                  color: getStatusTextColor(paymentColor)
                }
              },
              !isDarkMode && {
                backgroundColor: getStatusBgColor(paymentColor),
                color: getStatusTextColor(paymentColor),
                '& .MuiChip-label': {
                  color: getStatusTextColor(paymentColor)
                }
              }
            ]}
          />
        )}
        <Button
          variant='outlined'
          onClick={handleBack}
          sx={{
            px: 3,
            py: 1.25,
            fontWeight: 600,
            textTransform: 'uppercase',
            minWidth: 0
          }}
        >
          {t('back')}
        </Button>
        {needsPayment && (
          <Button
            variant='contained'
            color='success'
            onClick={() => setPayDialogOpen(true)}
            startIcon={<Icon icon='tabler-credit-card' />}
            sx={{
              px: 3,
              py: 1.25,
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            {t('payNow')}
          </Button>
        )}
        {canCancel && (
          <>
            <Button
              variant='contained'
              endIcon={<Icon icon='tabler-chevron-down' />}
              onClick={handleMenuOpen}
              sx={{
                px: 3,
                py: 1.25,
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              {t('actions')}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
            >
              <MenuItem onClick={handleCancelOrder}>
                <Icon icon='tabler-x' style={{ marginRight: 8 }} />
                {t('cancelOrder')}
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    </Box>
    </>
  )
}

export default OrderDetailHeader
