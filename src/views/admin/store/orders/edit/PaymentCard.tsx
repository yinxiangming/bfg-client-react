'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'

import { getIntlLocale } from '@/utils/format'

type Payment = {
  id: number
  payment_number: string
  amount: string | number
  currency_code?: string
  status: string
  gateway_name?: string
  gateway_transaction_id?: string
  created_at: string
  completed_at?: string | null
}

type PaymentCardProps = {
  payments?: Payment[]
}

const PaymentCard = ({ payments = [] }: PaymentCardProps) => {
  const t = useTranslations('admin')

  const getPaymentStatusLabel = (status: string) => {
    const key = `payments.status.${status}`
    const has = (t as any).has ? (t as any).has(key) : true
    return has ? t(key as any) : status
  }

  const formatCurrency = (amount: string | number, currencyCode?: string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    const symbol = currencyCode || '$'
    return `${symbol}${numAmount.toFixed(2)}`
  }

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString(getIntlLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const colorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      paid: 'success',
      failed: 'error',
      refunded: 'secondary'
    }
    return colorMap[status] || 'default'
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader title={t('payments.title', { count: payments.length })} />
        <CardContent sx={{ py: 3 }}>
          <Typography variant='body2' color='text.secondary' align='center'>
            {t('payments.empty')}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title={t('payments.title', { count: payments.length })} />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {payments.map((payment, index) => (
          <Box key={payment.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: 'success.main' }}>
                    <i className='tabler-currency-dollar' />
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='h6' sx={{ fontWeight: 500 }}>
                      {payment.payment_number}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {formatCurrency(payment.amount, payment.currency_code)}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={getPaymentStatusLabel(payment.status)}
                  color={getStatusColor(payment.status)}
                  variant='tonal'
                  size='small'
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {payment.gateway_name && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='text.secondary'>
                      {t('payments.labels.gateway')}:
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>
                      {payment.gateway_name}
                    </Typography>
                  </Box>
                )}
                {payment.gateway_transaction_id && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='text.secondary'>
                      {t('payments.labels.transactionId')}:
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {payment.gateway_transaction_id}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>
                    {t('payments.labels.created')}:
                  </Typography>
                  <Typography variant='body2' sx={{ fontWeight: 500 }}>
                    {formatDateTime(payment.created_at)}
                  </Typography>
                </Box>
                {payment.completed_at && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='text.secondary'>
                      {t('payments.labels.completed')}:
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 500 }} color='success.main'>
                      {formatDateTime(payment.completed_at)}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Typography variant='body2' color='text.secondary'>
                  {t('payments.labels.paymentAmount')}:
                </Typography>
                <Typography variant='h6' sx={{ fontWeight: 500 }} color='success.main'>
                  {formatCurrency(payment.amount, payment.currency_code)}
                </Typography>
              </Box>
            </Box>
            {index < payments.length - 1 && <Divider sx={{ my: 3 }} />}
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}

export default PaymentCard
