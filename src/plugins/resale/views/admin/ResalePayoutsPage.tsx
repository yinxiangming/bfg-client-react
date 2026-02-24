'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import LinkMui from '@mui/material/Link'
import Pagination from '@mui/material/Pagination'

// Services & Types
import { getResalePayouts, getResalePayoutStats, markResalePayoutAsPaid } from '../../services'
import type { ResalePayoutStats } from '../../services'
import type { ResalePayout, ResalePayoutStatus, ResalePayoutItem } from '../../types'
import type { Customer } from '@/services/store'
import CustomerSearchAutocomplete from '@/components/CustomerSearchAutocomplete'

const statusColors: Record<ResalePayoutStatus, 'default' | 'success' | 'error'> = {
  pending: 'default',
  paid: 'success',
  failed: 'error'
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

const ResalePayoutsPage = () => {
  const t = useTranslations('resale')
  const [payouts, setPayouts] = useState<ResalePayout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ResalePayoutStatus | ''>('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<ResalePayoutStats | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [markPaidPayout, setMarkPaidPayout] = useState<ResalePayout | null>(null)
  const [markPaidPaymentMethod, setMarkPaidPaymentMethod] = useState('')
  const [markPaidPaymentRef, setMarkPaidPaymentRef] = useState('')
  const [itemsModalPayout, setItemsModalPayout] = useState<ResalePayout | null>(null)
  const [paymentModalPayout, setPaymentModalPayout] = useState<ResalePayout | null>(null)
  const [confirmMarkPaidOpen, setConfirmMarkPaidOpen] = useState(false)

  const loadPayouts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { status?: string; customer?: number; page: number; page_size: number } = {
        page,
        page_size: pageSize
      }
      if (statusFilter) params.status = statusFilter
      if (selectedCustomer?.id) params.customer = selectedCustomer.id
      const response = await getResalePayouts(params)
      setPayouts(response.results || [])
      setTotalCount(response.count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadPayouts'))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, selectedCustomer?.id, page, pageSize, t])

  const loadStats = useCallback(async () => {
    try {
      const params: { status?: string; customer?: number } = {}
      if (statusFilter) params.status = statusFilter
      if (selectedCustomer?.id) params.customer = selectedCustomer.id
      const data = await getResalePayoutStats(Object.keys(params).length ? params : undefined)
      setStats(data)
    } catch {
      setStats(null)
    }
  }, [statusFilter, selectedCustomer?.id])

  useEffect(() => {
    loadPayouts()
  }, [loadPayouts])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    setPage(1)
  }, [pageSize])

  const openMarkPaidDialog = (payout: ResalePayout) => {
    setMarkPaidPayout(payout)
    setMarkPaidPaymentMethod(payout.payment_method || '')
    setMarkPaidPaymentRef(payout.payment_reference || '')
  }

  const closeMarkPaidDialog = () => {
    setMarkPaidPayout(null)
    setMarkPaidPaymentMethod('')
    setMarkPaidPaymentRef('')
  }

  const openConfirmMarkPaid = () => setConfirmMarkPaidOpen(true)
  const closeConfirmMarkPaid = () => setConfirmMarkPaidOpen(false)

  const handleMarkPaidSubmit = async () => {
    if (!markPaidPayout) return
    setConfirmMarkPaidOpen(false)
    setProcessingId(markPaidPayout.id)
    try {
      await markResalePayoutAsPaid(markPaidPayout.id, {
        payment_method: markPaidPaymentMethod,
        payment_reference: markPaidPaymentRef
      })
      closeMarkPaidDialog()
      await loadPayouts()
      await loadStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.markPaidFailed'))
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTimeToMinute = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number | string | null | undefined) => {
    const n = typeof amount === 'number' ? amount : Number(amount)
    if (Number.isNaN(n)) return '-'
    return `$${n.toFixed(2)}`
  }

  /** Payout items sorted by created_at descending (API returns ordered; ensure client sort) */
  const sortedItems = (payout: ResalePayout): ResalePayoutItem[] => {
    const list = payout.items ?? []
    return [...list].sort((a, b) => {
      const t1 = a.created_at ? new Date(a.created_at).getTime() : 0
      const t2 = b.created_at ? new Date(b.created_at).getTime() : 0
      return t2 - t1
    })
  }

  const pendingCount = stats?.pending_count ?? 0
  const paidCount = stats?.paid_count ?? 0
  const paidSum = stats?.paid_sum ?? 0
  const payableSum = stats?.payable_sum ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <>
      <Card>
        <CardHeader
          title={t('admin.payouts.title')}
          subheader={
            statusFilter
              ? t('admin.payouts.filterStatus', { status: statusFilter })
              : t('admin.payouts.subheaderSummary', { pendingCount, paidCount })
          }
          action={
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'baseline', pr: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.payouts.statsPaid')}:
                </Typography>
                <Typography component="span" color="success.main" fontWeight={600} sx={{ fontSize: '1.35rem' }}>
                  {formatCurrency(paidSum)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.payouts.statsPayable')}:
                </Typography>
                <Typography component="span" fontWeight={600} sx={{ fontSize: '1.35rem' }}>
                  {formatCurrency(payableSum)}
                </Typography>
              </Box>
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Box sx={{ minWidth: 260 }}>
              <CustomerSearchAutocomplete
                value={selectedCustomer}
                onChange={(c) => {
                  setSelectedCustomer(c)
                  setPage(1)
                }}
                label={t('admin.payouts.filterCustomer')}
                placeholder={t('admin.payouts.filterCustomerPlaceholder')}
                size="small"
              />
            </Box>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('admin.payouts.statusLabel')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('admin.payouts.statusLabel')}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ResalePayoutStatus | '')
                  setPage(1)
                }}
              >
                <MenuItem value="">{t('admin.payouts.all')}</MenuItem>
                <MenuItem value="pending">{t('status.payout.pending')}</MenuItem>
                <MenuItem value="paid">{t('status.payout.paid')}</MenuItem>
                <MenuItem value="failed">{t('status.payout.failed')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : payouts.length === 0 ? (
            <Typography color="text.secondary" align="center" py={4}>
              {t('admin.payouts.noPayoutsFound')}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('admin.payouts.table.id')}</TableCell>
                    <TableCell>{t('admin.payouts.table.customer')}</TableCell>
                    <TableCell>{t('admin.payouts.table.amount')}</TableCell>
                    <TableCell>{t('admin.payouts.table.status')}</TableCell>
                    <TableCell>{t('admin.payouts.table.created')}</TableCell>
                    <TableCell>{t('admin.payouts.table.paid')}</TableCell>
                    <TableCell>{t('admin.payouts.table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id} hover>
                      <TableCell>#{payout.id}</TableCell>
                      <TableCell>
                        <LinkMui
                          component={Link}
                          href={`/admin/store/customers/${payout.customer}`}
                          color="primary"
                          underline="hover"
                        >
                          {payout.customer_name || t('customerId', { id: payout.customer })}
                        </LinkMui>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(payout.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t(`status.payout.${payout.status}`)}
                          size="small"
                          color={statusColors[payout.status]}
                        />
                      </TableCell>
                      <TableCell>{formatDate(payout.created_at)}</TableCell>
                      <TableCell>{formatDate(payout.paid_at)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Button size="small" variant="outlined" onClick={() => setItemsModalPayout(payout)}>
                            {t('admin.payouts.table.itemsCount', { count: payout.items?.length ?? 0 })}
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => setPaymentModalPayout(payout)}>
                            {t('admin.payouts.table.payment')}
                          </Button>
                          {payout.status === 'pending' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => openMarkPaidDialog(payout)}
                              disabled={processingId === payout.id}
                            >
                              {processingId === payout.id ? t('admin.payouts.table.processing') : t('admin.payouts.table.markPaid')}
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!loading && !error && payouts.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('admin.payouts.pageSize')}
                </Typography>
                <Select
                  size="small"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  sx={{ minWidth: 72 }}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!markPaidPayout} onClose={closeMarkPaidDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.payouts.markPaidTitle')}</DialogTitle>
        <DialogContent>
          {markPaidPayout && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('admin.payouts.payoutToCustomer', {
                  id: markPaidPayout.id,
                  amount: formatCurrency(markPaidPayout.total_amount),
                  customer: markPaidPayout.customer_name || t('customerId', { id: markPaidPayout.customer })
                })}
              </Typography>
              <TextField
                label={t('admin.payouts.paymentMethod')}
                size="small"
                value={markPaidPaymentMethod}
                onChange={(e) => setMarkPaidPaymentMethod(e.target.value)}
                placeholder={t('admin.payouts.paymentMethodPlaceholder')}
                fullWidth
              />
              <TextField
                label={t('admin.payouts.paymentReference')}
                size="small"
                value={markPaidPaymentRef}
                onChange={(e) => setMarkPaidPaymentRef(e.target.value)}
                placeholder={t('admin.payouts.paymentReferencePlaceholder')}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMarkPaidDialog}>{t('admin.payouts.cancel')}</Button>
          <Button
            variant="contained"
            color="success"
            onClick={openConfirmMarkPaid}
            disabled={!markPaidPayout || processingId === markPaidPayout?.id}
          >
            {markPaidPayout && processingId === markPaidPayout.id ? t('admin.payouts.table.processing') : t('admin.payouts.confirmPaid')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm before marking as paid: email will be sent to customer */}
      <Dialog open={confirmMarkPaidOpen} onClose={closeConfirmMarkPaid} maxWidth="xs" fullWidth>
        <DialogTitle>{t('admin.payouts.confirmMarkPaidTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('admin.payouts.confirmMarkPaidMessage', { id: markPaidPayout?.id ?? 0 })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmMarkPaid}>{t('admin.payouts.cancel')}</Button>
          <Button variant="contained" color="success" onClick={handleMarkPaidSubmit} disabled={!markPaidPayout}>
            {t('admin.payouts.yesMarkPaid')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payout items modal (time descending) */}
      <Dialog
        open={!!itemsModalPayout}
        onClose={() => setItemsModalPayout(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{t('admin.payouts.itemsModalTitle', { id: (itemsModalPayout as ResalePayout)?.id ?? 0 })}</DialogTitle>
        <DialogContent>
          {itemsModalPayout && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {formatCurrency(itemsModalPayout.total_amount)} ·{' '}
                {itemsModalPayout.customer_name || t('customerId', { id: itemsModalPayout.customer })}
              </Typography>
              <TableContainer
                sx={{ minHeight: 200, maxHeight: '60vh', overflow: 'auto' }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('admin.payouts.itemsTable.created')}</TableCell>
                      <TableCell>{t('admin.payouts.itemsTable.product')}</TableCell>
                      <TableCell>{t('admin.payouts.itemsTable.order')}</TableCell>
                      <TableCell align="right">{t('admin.payouts.itemsTable.salePrice')}</TableCell>
                      <TableCell align="right">{t('admin.payouts.itemsTable.commissionPct')}</TableCell>
                      <TableCell align="right">{t('admin.payouts.itemsTable.payoutAmount')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedItems(itemsModalPayout).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDateTimeToMinute(item.created_at)}</TableCell>
                        <TableCell>
                          {item.product_id != null && item.product_id !== undefined ? (
                            <LinkMui
                              component="a"
                              href={`/admin/store/products/${item.product_id}/edit`}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="primary"
                              underline="hover"
                            >
                              {item.product_name || t('productId', { id: item.product_id })}
                            </LinkMui>
                          ) : (
                            item.product_name || `#${item.resale_product}`
                          )}
                        </TableCell>
                        <TableCell>
                          {item.order_id != null && item.order_id !== undefined ? (
                            <LinkMui
                              component="a"
                              href={`/admin/store/orders/${item.order_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="primary"
                              underline="hover"
                            >
                              {t('admin.payouts.itemsTable.orderId', { id: item.order_id })}
                            </LinkMui>
                          ) : (
                            `#${item.order_item}`
                          )}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.sale_price)}</TableCell>
                        <TableCell align="right">
                          {typeof item.commission_rate === 'number'
                            ? item.commission_rate.toFixed(1)
                            : Number(item.commission_rate).toFixed(1)}
                          %
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.payout_amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {sortedItems(itemsModalPayout).length === 0 && (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  {t('admin.payouts.noItems')}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemsModalPayout(null)}>{t('admin.payouts.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Payment & preference detail modal */}
      <Dialog
        open={!!paymentModalPayout}
        onClose={() => setPaymentModalPayout(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('admin.payouts.paymentDetailsTitle', { id: (paymentModalPayout as ResalePayout)?.id ?? 0 })}</DialogTitle>
        <DialogContent>
          {paymentModalPayout && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(paymentModalPayout.total_amount)} ·{' '}
                {paymentModalPayout.customer_name || t('customerId', { id: paymentModalPayout.customer })}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {t('admin.payouts.thisPayoutActual')}
              </Typography>
              <Typography variant="body2">
                <strong>{t('admin.payouts.paymentMethodLabel')}</strong> {paymentModalPayout.payment_method || t('admin.payouts.dash')}
              </Typography>
              <Typography variant="body2">
                <strong>{t('admin.payouts.paymentReferenceLabel')}</strong> {paymentModalPayout.payment_reference || t('admin.payouts.dash')}
              </Typography>
              {paymentModalPayout.notes ? (
                <Typography variant="body2">
                  <strong>{t('admin.payouts.notesLabel')}</strong> {paymentModalPayout.notes}
                </Typography>
              ) : null}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                {t('admin.payouts.customerPreference')}
              </Typography>
              <Typography variant="body2">
                <strong>{t('admin.payouts.preferredPayoutMethod')}</strong>{' '}
                {paymentModalPayout.customer_preferred_payout_method || t('admin.payouts.dash')}
              </Typography>
              {paymentModalPayout.customer_payout_method_notes ? (
                <Typography variant="body2">
                  <strong>{t('admin.payouts.preferenceNotes')}</strong> {paymentModalPayout.customer_payout_method_notes}
                </Typography>
              ) : null}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentModalPayout(null)}>{t('admin.payouts.close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ResalePayoutsPage
