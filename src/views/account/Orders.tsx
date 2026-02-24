'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { getIntlLocale } from '@/utils/format'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Pagination from '@mui/material/Pagination'

// Component Imports
import CustomTextField from '@components/ui/TextField'

// Utils Imports
import { meApi } from '@/utils/meApi'
import { getMediaUrl } from '@/utils/media'

interface Order {
  id: number
  order_number: string
  status: string
  payment_status?: string
  total?: string
  amounts?: {
    subtotal?: string | number
    shipping_cost?: string | number
    tax?: string | number
    discount?: string | number
    total?: string | number
  }
  created_at?: string
  timestamps?: {
    created_at?: string
    updated_at?: string
  }
  shipping_address?: any
  items?: any[]
}

const Orders = () => {
  const t = useTranslations('account.orders')

  const PAGE_SIZE = 10

  // States
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const fetchOrders = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await meApi.getOrders({ page, page_size: PAGE_SIZE })
      const data = response.results ?? response.data
      const list = Array.isArray(data) ? data : []
      setOrders(list)
      setTotalCount(response.count ?? list.length)
    } catch (err: any) {
      setError(err.message || t('failedLoad'))
      console.error('Failed to fetch orders:', err)
      setOrders([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(currentPage)
  }, [currentPage])

  const handleCancelClick = (orderId: number) => {
    setSelectedOrderId(orderId)
    setCancelReason('')
    setCancelDialogOpen(true)
  }

  const handleCancelOrder = async () => {
    if (!selectedOrderId) return

    try {
      setCancelling(true)
      await meApi.cancelOrder(selectedOrderId, { reason: cancelReason })
      setCancelDialogOpen(false)
      setSelectedOrderId(null)
      setCancelReason('')
      await fetchOrders(currentPage)
    } catch (err: any) {
      setError(err.message || t('failedCancel'))
    } finally {
      setCancelling(false)
    }
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning'
      case 'processing':
        return 'info'
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'error'
      case 'refunded':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    const key = status?.toLowerCase()
    const map: Record<string, string> = {
      pending: 'statusPending',
      processing: 'statusProcessing',
      completed: 'statusCompleted',
      cancelled: 'statusCancelled'
    }
    return key && map[key] ? t(map[key]) : (status || t('unknown'))
  }

  const getPaymentStatusLabel = (paymentStatus: string) => {
    const key = paymentStatus?.toLowerCase()
    const map: Record<string, string> = {
      paid: 'paymentPaid',
      pending: 'paymentPending',
      failed: 'paymentFailed',
      refunded: 'paymentRefunded'
    }
    return key && map[key] ? t(map[key]) : (paymentStatus || t('unknown'))
  }

  const formatProducts = (items: any[]) => {
    if (!items || items.length === 0) return t('na')
    
    const productNames = items.map(item => {
      const name = item.product_name || t('unknownProduct')
      const variant = item.variant_name ? ` (${item.variant_name})` : ''
      const quantity = item.quantity || 1
      return `${name}${variant} × ${quantity}`
    })
    
    // Show up to 2 products, then show "and X more" if there are more
    if (productNames.length <= 2) {
      return productNames.join(', ')
    } else {
      return `${productNames.slice(0, 2).join(', ')}, ${t('andMore', { count: productNames.length - 2 })}`
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card
          variant='outlined'
          sx={{
            boxShadow: 'none',
            borderRadius: 2
          }}
        >
          <CardContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
            {error && (
              <Alert severity='error' className='mbe-4' onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {loading ? (
              <Typography>{t('loading')}</Typography>
            ) : orders.length === 0 ? (
              <Box className='text-center py-8'>
                <Typography variant='body1' className='mbe-4'>
                  {t('noOrders')}
                </Typography>
                <Button variant='contained' component={Link} href='/'>
                  {t('startShopping')}
                </Button>
              </Box>
            ) : (
              <>
              <TableContainer>
                <Table sx={{ minWidth: 650 }} size='medium'>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('orderNumber')}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('products')}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('total')}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('date')}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('status')}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('payment')}</TableCell>
                      <TableCell align='right' sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {t('actions')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.id} hover>
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography
                            variant='body2'
                            component={Link}
                            href={`/account/orders/${order.id}`}
                            sx={{
                              fontWeight: 600,
                              color: 'primary.main',
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline',
                                cursor: 'pointer'
                              }
                            }}
                          >
                            {order.order_number || `#${order.id}`}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.75, maxWidth: 320, verticalAlign: 'top' }}>
                          <Stack direction='column' spacing={1} sx={{ minWidth: 0 }}>
                            {(order.items || []).map((item: any, idx: number) => {
                              const name = item.product_name || t('unknownProduct')
                              const variant = item.variant_name ? ` (${item.variant_name})` : ''
                              const qty = item.quantity ?? 1
                              const line = `${name}${variant} × ${qty}`
                              return (
                                <Stack key={idx} direction='row' alignItems='center' spacing={1.5}>
                                  <Avatar
                                    src={item.image_url ? getMediaUrl(item.image_url) : undefined}
                                    variant='rounded'
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      flexShrink: 0,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      bgcolor: 'action.hover'
                                    }}
                                  >
                                    {!item.image_url && (
                                      <Typography variant='caption' color='text.secondary'>
                                        {name[0] || '?'}
                                      </Typography>
                                    )}
                                  </Avatar>
                                  <Typography
                                    variant='body2'
                                    color='text.secondary'
                                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
                                  >
                                    {line}
                                  </Typography>
                                </Stack>
                              )
                            })}
                            {(order.items?.length ?? 0) === 0 && (
                              <Typography variant='body2' color='text.secondary'>
                                {t('na')}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {(() => {
                              const total = order.amounts?.total || order.total
                              if (!total) return t('na')
                              const totalNum = typeof total === 'string' ? parseFloat(total) : total
                              if (isNaN(totalNum)) return t('na')
                              return `$${totalNum.toFixed(2)}`
                            })()}
                          </Typography>
                        </TableCell>                        
                        <TableCell sx={{ py: 1.75 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {(() => {
                              try {
                                const dateStr = order.timestamps?.created_at || order.created_at
                                if (!dateStr) return t('na')
                                const date = new Date(dateStr)
                                if (isNaN(date.getTime())) return t('na')
                                return date.toLocaleDateString(getIntlLocale(), {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              } catch {
                                return t('na')
                              }
                            })()}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.75 }}>
                          <Chip
                            label={getStatusLabel(order.status ?? '')}
                            color={getStatusColor(order.status)}
                            size='small'
                            sx={{ px: 1.25, fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1.75 }}>
                          <Chip
                            label={getPaymentStatusLabel(order.payment_status ?? '')}
                            color={getPaymentStatusColor(order.payment_status ?? '')}
                            size='small'
                            sx={{ px: 1.25, fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align='right' sx={{ py: 1.75 }}>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {typeof order.id === 'number' && !isNaN(order.id) ? (
                              <Button
                                size='small'
                                variant='outlined'
                                component={Link}
                                href={`/account/orders/${order.id}`}
                                sx={{ textTransform: 'none', px: 2.5, borderRadius: 1.5 }}
                              >
                                {t('view')}
                              </Button>
                            ) : (
                              <Button
                                size='small'
                                variant='outlined'
                                disabled
                                sx={{ textTransform: 'none', px: 2.5, borderRadius: 1.5 }}
                              >
                                {t('view')}
                              </Button>
                            )}
                            {order.status?.toLowerCase() !== 'cancelled' &&
                              order.status?.toLowerCase() !== 'completed' && (
                                <Button
                                  size='small'
                                  variant='outlined'
                                  color='error'
                                  onClick={() => handleCancelClick(order.id)}
                                  sx={{ textTransform: 'none', px: 2.5, borderRadius: 1.5 }}
                                >
                                  {t('cancel')}
                                </Button>
                              )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {!loading && orders.length > 0 && totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color='primary'
                    shape='rounded'
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('cancelOrder')}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' className='mbe-4'>
            {t('cancelConfirm')}
          </Typography>
          <CustomTextField
            fullWidth
            multiline
            rows={4}
            label={t('reason')}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder={t('reasonPlaceholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>
            {t('keepOrder')}
          </Button>
          <Button variant='contained' color='error' onClick={handleCancelOrder} disabled={cancelling}>
            {cancelling ? t('cancelling') : t('cancelOrder')}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default Orders
