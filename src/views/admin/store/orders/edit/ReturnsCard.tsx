'use client'

// React Imports
import { useCallback, useEffect, useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import { getIntlLocale } from '@/utils/format'

// Service Imports
import { getOrderReturns, type ReturnRequest, type ReturnStatus } from '@/services/store'

type ReturnsCardProps = {
  orderId: number
  /** Bumped by the page after it creates a return, so the list reloads. */
  refreshKey?: number
}

const returnStatusColors: Record<ReturnStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  open: 'warning',
  approved: 'info',
  received: 'info',
  inspected: 'info',
  refunded: 'success',
  closed: 'default',
  rejected: 'error',
  cancelled: 'default'
}

const ReturnsCard = ({ orderId, refreshKey = 0 }: ReturnsCardProps) => {
  const t = useTranslations('admin')
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setReturns(await getOrderReturns(orderId))
    } catch (err: any) {
      setError(err.message || t('orders.returns.messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [orderId, t])

  useEffect(() => {
    fetchReturns()
  }, [fetchReturns, refreshKey])

  const getStatusLabel = (status: string) => {
    const key = `orders.returns.status.${status}`
    const has = (t as any).has ? (t as any).has(key) : true
    return has ? t(key as any) : status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(getIntlLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })

  return (
    <Card>
      <CardHeader title={t('orders.returns.title', { count: returns.length })} sx={{ pb: 0 }} />
      <CardContent sx={{ pt: 2, '&:last-child': { pb: 2 } }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : returns.length === 0 ? (
          <Alert severity='info'>{t('orders.returns.empty')}</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {returns.map((returnRequest, index) => {
              // When the return reached each step; a step it has not reached is left out.
              const milestones = [
                { key: 'requested', value: returnRequest.created_at, color: 'text.secondary' },
                { key: 'approved', value: returnRequest.approved_at, color: 'info.main' },
                { key: 'refunded', value: returnRequest.refunded_at, color: 'success.main' },
                { key: 'closed', value: returnRequest.closed_at, color: 'text.secondary' }
              ].filter((milestone): milestone is { key: string; value: string; color: string } => !!milestone.value)

              return (
                <Box
                  key={returnRequest.id}
                  sx={{ py: 2, ...(index === 0 ? {} : { borderTop: '1px solid', borderColor: 'divider' }) }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                      {returnRequest.return_number}
                    </Typography>
                    <Chip
                      label={getStatusLabel(returnRequest.status)}
                      size='small'
                      color={returnStatusColors[returnRequest.status] || 'default'}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {milestones.map(milestone => (
                      <Typography key={milestone.key} variant='body2' color={milestone.color}>
                        {t(`orders.returns.labels.${milestone.key}` as any)}: {formatDateTime(milestone.value)}
                      </Typography>
                    ))}
                  </Box>
                  {!!returnRequest.items?.length && (
                    <Box component='ul' sx={{ m: 0, mt: 1, pl: 2.5 }}>
                      {returnRequest.items.map(item => (
                        <Typography component='li' key={item.id} variant='body2'>
                          {item.product_name} × {item.quantity}
                          {item.reason ? ` · ${item.reason}` : ''}
                        </Typography>
                      ))}
                    </Box>
                  )}
                  {returnRequest.customer_note && (
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                      {t('orders.returns.labels.customerNote')}: {returnRequest.customer_note}
                    </Typography>
                  )}
                </Box>
              )
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ReturnsCard
