'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'
import { useTheme } from '@mui/material/styles'

import { getIntlLocale } from '@/utils/format'

// Component Imports
import { Icon } from '@iconify/react'

// Utils Imports
import { meApi } from '@/utils/meApi'

interface Payment {
  id: number
  payment_number: string
  status: string
  amount: string | number | null | undefined
  currency?: {
    code: string
    symbol: string
  } | null
  gateway?: {
    name: string
    gateway_type: string
  } | null
  payment_method?: {
    display_info: string
    card_brand?: string
    card_last4?: string
  } | null
  created_at: string
  completed_at?: string | null
  gateway_transaction_id?: string | null
  order?: number | null
  invoice?: number | null
}

interface PaymentsCardProps {
  orderId: number
}

const paymentStatusColors: { [key: string]: 'success' | 'warning' | 'error' | 'info' | 'default' } = {
  completed: 'success',
  processing: 'info',
  pending: 'warning',
  failed: 'error',
  refunded: 'default'
}

const PaymentsCard = ({ orderId }: PaymentsCardProps) => {
  const t = useTranslations('account.orderDetail')
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState<number | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    fetchPayments()
  }, [orderId])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await meApi.getPayments({ order_id: orderId })
      const paymentsList = response.results || response.data || response || []
      setPayments(Array.isArray(paymentsList) ? paymentsList : [])
    } catch (err: any) {
      setError(err.message || t('failedLoadPayments'))
    } finally {
      setLoading(false)
    }
  }

  const handleSendReceipt = async (paymentId: number) => {
    try {
      setSending(paymentId)
      const response = await meApi.sendPaymentReceipt(paymentId)
      setSnackbar({
        open: true,
        message: response.message || t('receiptSent'),
        severity: 'success'
      })
      // Refresh payments
      fetchPayments()
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || t('failedSendReceipt'),
        severity: 'error'
      })
    } finally {
      setSending(null)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return t('na')
    const date = new Date(dateString)
    return date.toLocaleDateString(getIntlLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: string | number | undefined | null, currency?: { code: string; symbol: string }) => {
    const symbol = currency?.symbol || '$'
    if (amount === undefined || amount === null) {
      return `${symbol}0.00`
    }
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(value)) {
      return `${symbol}0.00`
    }
    return `${symbol}${value.toFixed(2)}`
  }

  const getPaymentMethodDisplay = (payment: Payment) => {
    if (payment.payment_method) {
      if (payment.payment_method.card_brand && payment.payment_method.card_last4) {
        return `${payment.payment_method.card_brand.toUpperCase()} •••• ${payment.payment_method.card_last4}`
      }
      return payment.payment_method.display_info || 'Payment Method'
    }
    if (payment.gateway) {
      return payment.gateway.name || payment.gateway.gateway_type || 'Unknown Gateway'
    }
    return 'Unknown'
  }

  // Get translated payment status
  const getPaymentStatusText = (status: string) => {
    if (!status) return t('statusPending')
    const normalizedStatus = status.toLowerCase()
    const statusMap: { [key: string]: string } = {
      'completed': 'statusCompleted',
      'processing': 'statusProcessing',
      'pending': 'statusPending',
      'failed': 'statusFailed',
      'refunded': 'statusRefunded'
    }
    const statusKey = statusMap[normalizedStatus] || `status${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`
    return t(statusKey as any) || status
  }

  // Get color values for dark mode (Palette has no 'default', use grey for it)
  const getStatusBgColor = (color: 'success' | 'warning' | 'error' | 'info' | 'default') => {
    if (!isDarkMode) {
      return undefined // Use default Chip color in light mode
    }
    if (color === 'default') return theme.palette.grey[600]
    const paletteColor = theme.palette[color as 'success' | 'warning' | 'error' | 'info']
    if (paletteColor && typeof paletteColor === 'object' && 'main' in paletteColor) {
      return paletteColor.main as string
    }
    return theme.palette.grey[600]
  }

  const getStatusTextColor = (color: 'success' | 'warning' | 'error' | 'info' | 'default') => {
    if (!isDarkMode) {
      return undefined // Use default Chip color in light mode
    }
    // In dark mode, always use white text
    return '#fff'
  }

  return (
    <>
      <Card variant='outlined' sx={{ boxShadow: 'none', borderRadius: 2 }}>
        <CardHeader
          title={t('payments')}
          sx={{
            '& .MuiCardHeader-title': {
              fontSize: '1.125rem',
              fontWeight: 500
            }
          }}
        />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : error ? (
            <Alert severity='error'>{error}</Alert>
          ) : payments.length === 0 ? (
            <Alert severity='info'>{t('noPayments')}</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {payments.map((payment) => (
                <Box
                  key={payment.id}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 0.5 }}>
                        {payment.payment_number}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          label={getPaymentStatusText(payment.status)}
                          size='small'
                          {...(isDarkMode ? {} : { color: paymentStatusColors[payment.status] || 'default' })}
                          sx={[
                            {
                              fontSize: '0.75rem'
                            },
                            isDarkMode && {
                              backgroundColor: getStatusBgColor(paymentStatusColors[payment.status] || 'default'),
                              color: getStatusTextColor(paymentStatusColors[payment.status] || 'default'),
                              '& .MuiChip-label': {
                                color: getStatusTextColor(paymentStatusColors[payment.status] || 'default')
                              }
                            },
                            !isDarkMode && {
                              backgroundColor: getStatusBgColor(paymentStatusColors[payment.status] || 'default'),
                              color: getStatusTextColor(paymentStatusColors[payment.status] || 'default'),
                              '& .MuiChip-label': {
                                color: getStatusTextColor(paymentStatusColors[payment.status] || 'default')
                              }
                            }
                          ]}
                        />
                        <Typography variant='body2' color='text.secondary'>
                          {formatDate(payment.created_at)}
                        </Typography>
                        {payment.completed_at && (
                          <Typography variant='body2' color='success.main'>
                            {t('completed')}: {formatDate(payment.completed_at)}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                        {t('paymentMethod')}: {getPaymentMethodDisplay(payment)}
                      </Typography>
                      {payment.gateway_transaction_id && (
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                          {t('transactionId')}: {payment.gateway_transaction_id}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant='h6' sx={{ fontWeight: 600, mb: 0.5 }}>
                        {formatAmount(payment.amount, payment.currency ?? undefined)}
                      </Typography>
                      {payment.gateway && (
                        <Typography variant='body2' color='text.secondary'>
                          via {payment.gateway.name || payment.gateway.gateway_type}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  {payment.status === 'completed' && (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size='small'
                        variant='contained'
                        startIcon={<Icon icon='tabler-send' />}
                        onClick={() => handleSendReceipt(payment.id)}
                        disabled={sending === payment.id}
                        sx={{
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: 'none'
                          }
                        }}
                      >
                        {sending === payment.id ? t('sending') : t('sendReceipt')}
                      </Button>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default PaymentsCard
