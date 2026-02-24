'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Link from '@mui/material/Link'
import IconButton from '@mui/material/IconButton'

// Utils Imports
import { meApi } from '@/utils/meApi'
import { getIntlLocale } from '@/utils/format'

interface Payment {
  id: number
  order_id?: number
  order_number?: string
  amount: string | number
  currency?: string | number  // Can be currency code (string) or currency ID (number)
  status: string
  payment_method?: number | string  // Can be ID or display string
  payment_method_display?: string
  gateway_transaction_id?: string
  created_at: string
  updated_at?: string
}

const PaymentHistory = () => {
  const t = useTranslations('account.payments')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await meApi.getPayments()
      const paymentList = response.results || response.data || []
      setPayments(Array.isArray(paymentList) ? paymentList : [])
    } catch (err: any) {
      setError(err.message || t('failedLoad'))
      console.error('Failed to fetch payments:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'succeeded':
      case 'paid':
        return 'success'
      case 'pending':
      case 'processing':
        return 'warning'
      case 'failed':
      case 'cancelled':
      case 'refunded':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return t('date')
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return t('date')
      return date.toLocaleDateString(getIntlLocale(), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return t('date')
    }
  }

  const formatAmount = (amount: string | number, currency: string | number | undefined = 'USD') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return 'N/A'
    
    // Validate currency code - must be a 3-letter ISO 4217 code
    let currencyCode = 'USD'
    if (currency) {
      const currencyStr = String(currency).toUpperCase().trim()
      // Check if it's a valid ISO 4217 currency code (3 uppercase letters)
      if (/^[A-Z]{3}$/.test(currencyStr)) {
        currencyCode = currencyStr
      } else {
        // If it's a number (currency ID) or invalid format, use default
        console.warn(`Invalid currency code: ${currency}, using USD as default`)
      }
    }
    
    try {
      return new Intl.NumberFormat(getIntlLocale(), {
        style: 'currency',
        currency: currencyCode
      }).format(numAmount)
    } catch (error) {
      console.error('Failed to format currency:', error, { currency, currencyCode })
      // Fallback to simple formatting
      return `$${numAmount.toFixed(2)}`
    }
  }

  if (loading && payments.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          {t('paymentHistory')}
        </Typography>
      </Grid>

      {payments.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant='body1' sx={{ mb: 2 }}>
                  {t('noHistory')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('noHistoryHint')}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <TableContainer component={Card}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('date')}</TableCell>
                  <TableCell>{t('orderNumber')}</TableCell>
                  <TableCell>{t('amount')}</TableCell>
                  <TableCell>{t('method')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                  <TableCell>{t('reference')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.created_at)}</TableCell>
                    <TableCell>
                      {payment.order_id && payment.order_number ? (
                        <Link href={`/account/orders/${payment.order_id}`} underline='hover'>
                          {payment.order_number}
                        </Link>
                      ) : payment.order_id ? (
                        <Link href={`/account/orders/${payment.order_id}`} underline='hover'>
                          #{payment.order_id}
                        </Link>
                      ) : (
                        t('date')
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' className='font-semibold'>
                        {formatAmount(payment.amount, payment.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {payment.payment_method_display || t('date')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        size='small'
                        color={getStatusColor(payment.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' className='font-mono text-xs'>
                        {payment.gateway_transaction_id || t('date')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      )}
    </Grid>
  )
}

export default PaymentHistory

