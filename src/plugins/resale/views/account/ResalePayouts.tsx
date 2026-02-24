'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'

// Services & Types
import { getMyResalePayouts } from '../../services'
import type { ResalePayout, ResalePayoutStatus } from '../../types'

const statusColors: Record<ResalePayoutStatus, 'default' | 'success' | 'error'> = {
  pending: 'default',
  paid: 'success',
  failed: 'error'
}

const PayoutRow = ({
  payout,
  t
}: {
  payout: ResalePayout
  t: (key: string, values?: Record<string, number>) => string
}) => {
  const [open, setOpen] = useState(false)

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number | string) => {
    const n = typeof amount === 'number' ? amount : Number(amount)
    return `$${(Number.isNaN(n) ? 0 : n).toFixed(2)}`
  }

  return (
    <>
      <TableRow hover onClick={() => setOpen(!open)} sx={{ cursor: 'pointer' }}>
        <TableCell sx={{ py: 1.75 }}>
          <IconButton size="small" sx={{ mr: 1 }}>
            <i className={`tabler-chevron-${open ? 'down' : 'right'}`} />
          </IconButton>
          #{payout.id}
        </TableCell>
        <TableCell sx={{ py: 1.75 }}>
          <Typography variant="body2" fontWeight={600} color="success.main">
            {formatCurrency(payout.total_amount)}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 1.75 }}>
          <Chip
            label={t(`myPayouts.status.${payout.status}`)}
            color={statusColors[payout.status]}
            size="small"
            sx={{ textTransform: 'capitalize', px: 1.25, fontWeight: 500 }}
          />
        </TableCell>
        <TableCell sx={{ py: 1.75 }}>
          <Typography variant="body2" color="text.secondary">
            {payout.payment_method || '-'}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 1.75 }}>
          <Typography variant="body2" color="text.secondary">
            {formatDate(payout.created_at)}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 1.75 }}>
          <Typography variant="body2" color="text.secondary">
            {formatDate(payout.paid_at)}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ pb: 0, pt: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('myPayouts.payoutItems')}
              </Typography>
              {payout.items && payout.items.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('myPayouts.table.product')}</TableCell>
                      <TableCell>{t('myPayouts.table.salePrice')}</TableCell>
                      <TableCell>{t('myPayouts.table.commission')}</TableCell>
                      <TableCell>{t('myPayouts.table.yourEarnings')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payout.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.product_name || t('productId', { id: item.resale_product })}
                        </TableCell>
                        <TableCell>{formatCurrency(item.sale_price)}</TableCell>
                        <TableCell>{item.commission_rate}%</TableCell>
                        <TableCell>
                          <Typography fontWeight={500} color="success.main">
                            {formatCurrency(item.payout_amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('myPayouts.noItemDetails')}
                </Typography>
              )}
              {payout.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('myPayouts.notes')}: {payout.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

const ResalePayouts = () => {
  const t = useTranslations('resale')
  const [payouts, setPayouts] = useState<ResalePayout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPayouts()
  }, [])

  const loadPayouts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyResalePayouts()
      setPayouts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadPayoutsAccount'))
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals (coerce amounts to number in case API returns string)
  const toNum = (v: unknown): number => (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || 0)
  const totals = payouts.reduce(
    (acc, payout) => {
      const amount = toNum(payout.total_amount)
      if (payout.status === 'paid') {
        acc.paid += amount
      } else if (payout.status === 'pending') {
        acc.pending += amount
      }
      return acc
    },
    { paid: 0, pending: 0 }
  )

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ boxShadow: 'none', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              {t('myPayouts.totalPaid')}
            </Typography>
            <Typography variant="h4" color="success.main" fontWeight={600}>
              ${Number(totals.paid).toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ boxShadow: 'none', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              {t('myPayouts.pendingPayout')}
            </Typography>
            <Typography variant="h4" color="warning.main" fontWeight={600}>
              ${Number(totals.pending).toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Payouts Table */}
      <Grid size={{ xs: 12 }}>
        <Card
          variant="outlined"
          sx={{
            boxShadow: 'none',
            borderRadius: 2
          }}
        >
          <CardContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('myPayouts.payoutHistory')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('myPayouts.trackEarnings')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : payouts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {t('myPayouts.emptyDetail')}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table sx={{ minWidth: 650 }} size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myPayouts.table.id')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myPayouts.table.amount')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myPayouts.table.status')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myPayouts.table.paymentMethod')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myPayouts.table.created')}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('myPayouts.table.paidDate')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payouts.map((payout) => (
                      <PayoutRow key={payout.id} payout={payout} t={t} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ResalePayouts
