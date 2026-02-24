'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
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
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Snackbar from '@mui/material/Snackbar'

import { getIntlLocale } from '@/utils/format'

// Service Imports
import { 
  getInvoices, 
  createInvoice, 
  updateInvoice,
  updateInvoiceItems,
  deleteInvoice, 
  sendInvoice,
  downloadInvoice,
  getInvoice,
  type Invoice, 
  type InvoiceCreatePayload 
} from '@/services/finance'

// Payments
import PayOrderDialog from '@/components/payments/PayOrderDialog'

// Context Imports
import { useBaseData } from '@/contexts/BaseDataContext'

// Component Imports
import InvoiceEditDialog from '@/components/invoice/InvoiceEditDialog'
import InvoiceViewDialog from '@/components/invoice/InvoiceViewDialog'

type OrderDetail = {
  id: number
  customer?: number | { id: number } | string
  subtotal?: number
  tax?: number
  total?: number
  items?: Array<{
    id: number
    product_name: string
    variant_name?: string
    quantity: number
    price: number | string
    subtotal: number | string
  }>
}

type InvoiceCardProps = {
  order: OrderDetail
  onInvoiceUpdate?: () => void
}

const invoiceStatusColors: { [key: string]: 'success' | 'warning' | 'error' | 'info' | 'default' } = {
  paid: 'success',
  sent: 'info',
  draft: 'default',
  overdue: 'error',
  cancelled: 'error'
}

const InvoiceCard = ({ order, onInvoiceUpdate }: InvoiceCardProps) => {
  const t = useTranslations('admin')
  // Get currencies from context
  const { currencies: contextCurrencies } = useBaseData()
  const currencies = contextCurrencies
    .filter(c => c.is_active)
    .map(c => ({ id: c.id, code: c.code, symbol: c.symbol }))
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [sending, setSending] = useState<number | null>(null)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; invoice: Invoice | null }>({
    open: false,
    invoice: null
  })
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [payDialogOpen, setPayDialogOpen] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [order.id])

  const formatStatusFallback = (status: string) => status.charAt(0).toUpperCase() + status.slice(1)

  const getInvoiceStatusLabel = (status: string) => {
    const key = `orders.invoice.status.${status}`
    const has = (t as any).has ? (t as any).has(key) : true
    return has ? t(key as any) : formatStatusFallback(status)
  }

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getInvoices({ order: order.id })
      setInvoices(data)
    } catch (err: any) {
      setError(err.message || t('orders.invoice.messages.loadInvoicesFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = () => {
    setEditingInvoice(null)
    setEditDialogOpen(true)
  }

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      // Fetch full invoice details with items
      const fullInvoice = await getInvoice(invoice.id)
      setViewingInvoice(fullInvoice)
      setViewDialogOpen(true)
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || t('orders.invoice.messages.loadInvoiceDetailsFailed'),
        severity: 'error'
      })
    }
  }

  const handleEditInvoice = async (invoice: Invoice) => {
    // Only paid and cancelled invoices cannot be edited
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      // If cannot edit, show view dialog instead
      handleViewInvoice(invoice)
      return
    }
    try {
      // Fetch full invoice details with items
      const fullInvoice = await getInvoice(invoice.id)
      setEditingInvoice(fullInvoice)
      setEditDialogOpen(true)
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || t('orders.invoice.messages.loadInvoiceDetailsFailed'),
        severity: 'error'
      })
    }
  }

  const handleSaveInvoice = async (data: InvoiceCreatePayload) => {
    try {
      setCreating(true)
      if (editingInvoice) {
        // Update existing invoice
        await updateInvoice(editingInvoice.id, {
          brand: data.brand,
          currency: data.currency,
          status: data.status,
          issue_date: data.issue_date,
          due_date: data.due_date,
          notes: data.notes
        })
        // Update items separately
        await updateInvoiceItems(editingInvoice.id, data.items)
        setSnackbar({
          open: true,
          message: t('orders.invoice.messages.updated'),
          severity: 'success'
        })
      } else {
        // Create new invoice
        await createInvoice(data)
        setSnackbar({
          open: true,
          message: t('orders.invoice.messages.created'),
          severity: 'success'
        })
      }
      await fetchInvoices()
      if (onInvoiceUpdate) {
        onInvoiceUpdate()
      }
      setEditDialogOpen(false)
      setEditingInvoice(null)
    } catch (err: any) {
      throw err // Let dialog handle the error
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteClick = (invoice: Invoice) => {
    // Only paid and cancelled invoices cannot be deleted
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      alert(t('orders.invoice.messages.cannotDelete', { status: getInvoiceStatusLabel(invoice.status) }))
      return
    }
    setDeleteDialog({ open: true, invoice })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.invoice) return

    try {
      setDeleting(deleteDialog.invoice.id)
      setError(null)
      await deleteInvoice(deleteDialog.invoice.id)
      await fetchInvoices()
      if (onInvoiceUpdate) {
        onInvoiceUpdate()
      }
      setDeleteDialog({ open: false, invoice: null })
    } catch (err: any) {
      setError(err.message || t('orders.invoice.messages.deleteFailed'))
    } finally {
      setDeleting(null)
    }
  }

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      setSending(invoiceId)
      setError(null)
      const response = await sendInvoice(invoiceId)
      setSnackbar({
        open: true,
        message: response.message || t('orders.invoice.messages.sent'),
        severity: 'success'
      })
      await fetchInvoices()
      if (onInvoiceUpdate) {
        onInvoiceUpdate()
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || t('orders.invoice.messages.sendFailed'),
        severity: 'error'
      })
    } finally {
      setSending(null)
    }
  }

  const handleDownloadInvoice = async (invoiceId: number, invoiceNumber: string) => {
    try {
      setDownloading(invoiceId)
      setError(null)
      const blob = await downloadInvoice(invoiceId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || t('orders.invoice.messages.downloadFailed'),
        severity: 'error'
      })
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t('orders.packages.shipping.na')
    return new Date(dateString).toLocaleDateString(getIntlLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: string | number | undefined | null, currency?: { code: string; symbol: string } | number) => {
    let symbol = '$'
    if (typeof currency === 'object' && currency?.symbol) {
      symbol = currency.symbol
    }
    if (amount === undefined || amount === null) {
      return `${symbol}0.00`
    }
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(value)) {
      return `${symbol}0.00`
    }
    return `${symbol}${value.toFixed(2)}`
  }

  const getCurrency = (invoice: Invoice) => {
    if (typeof invoice.currency === 'object') {
      return invoice.currency
    }
    return currencies.find(c => c.id === invoice.currency) || { code: 'USD', symbol: '$' }
  }

  const customerId = typeof order.customer === 'object' ? order.customer.id : Number(order.customer)
  const canPayCustomer = Number.isFinite(customerId) && customerId > 0

  const handlePaymentSuccess = async () => {
    await fetchInvoices()
    if (onInvoiceUpdate) {
      onInvoiceUpdate()
    }
    setSnackbar({
      open: true,
      message: t('orders.invoice.messages.paymentSuccess'),
      severity: 'success'
    })
  }

  return (
    <>
      <PayOrderDialog
        open={payDialogOpen}
        onClose={() => setPayDialogOpen(false)}
        order={order}
        customerId={canPayCustomer ? customerId : undefined}
        onPaymentSuccess={handlePaymentSuccess}
      />
      <Card>
        <CardHeader 
          title={t('orders.invoice.title', { count: invoices.length })}
          action={
            <Button
              variant='contained'
              size='small'
              onClick={handleCreateInvoice}
              startIcon={<i className='tabler-plus' />}
              sx={{
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none'
                }
              }}
            >
              {t('orders.invoice.createInvoice')}
            </Button>
          }
        />
        <CardContent>
          {error && (
            <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : invoices.length === 0 ? (
            <Alert severity='info'>{t('orders.invoice.empty')}</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {invoices.map((invoice) => {
                const currency = getCurrency(invoice)
                // Only paid and cancelled invoices cannot be deleted
                const canDelete = invoice.status !== 'paid' && invoice.status !== 'cancelled'
                const canEdit = invoice.status !== 'paid' && invoice.status !== 'cancelled'
                const canPay = invoice.status !== 'paid'

                return (
                  <Box
                    key={invoice.id}
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
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                            {invoice.invoice_number}
                          </Typography>
                          <Chip
                            label={getInvoiceStatusLabel(invoice.status)}
                            size='small'
                            color={invoiceStatusColors[invoice.status] || 'default'}
                            sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {t('orders.invoice.labels.issue')}: {formatDate(invoice.issue_date)}
                          </Typography>
                          {invoice.due_date && (
                            <Typography variant='body2' color='text.secondary'>
                              {t('orders.invoice.labels.due')}: {formatDate(invoice.due_date)}
                            </Typography>
                          )}
                          {invoice.sent_date && (
                            <Typography variant='body2' color='info.main'>
                              {t('orders.invoice.labels.sent')}: {formatDate(invoice.sent_date)}
                            </Typography>
                          )}
                          {invoice.paid_date && (
                            <Typography variant='body2' color='success.main'>
                              {t('orders.invoice.labels.paid')}: {formatDate(invoice.paid_date)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', mr: 2 }}>
                        <Typography variant='h6' sx={{ fontWeight: 600, mb: 0.5 }}>
                          {formatAmount(invoice.total, currency)}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {t('orders.invoice.labels.subtotal')}: {formatAmount(invoice.subtotal, currency)}
                        </Typography>
                        {invoice.tax && parseFloat(String(invoice.tax || 0)) > 0 && (
                          <Typography variant='body2' color='text.secondary'>
                            {t('orders.invoice.labels.tax')}: {formatAmount(invoice.tax, currency)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    {(invoice.notes && invoice.notes.trim()) && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant='caption' color='text.secondary'>
                          {t('orders.invoice.labels.notes')}:
                        </Typography>
                        <Typography variant='body2' sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{invoice.notes}</Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                      {canDelete && (
                        <Button
                          size='small'
                          variant='outlined'
                          color='error'
                          startIcon={<i className='tabler-trash' />}
                          onClick={() => handleDeleteClick(invoice)}
                          disabled={deleting === invoice.id}
                        >
                          {deleting === invoice.id ? t('common.states.deleting') : t('orders.invoice.actions.delete')}
                        </Button>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                        {canPay && (
                          <Button
                            size='small'
                            variant='contained'
                            color='success'
                            startIcon={<i className='tabler-credit-card' />}
                            onClick={() => setPayDialogOpen(true)}
                            sx={{
                              boxShadow: 'none',
                              '&:hover': {
                                boxShadow: 'none'
                              }
                            }}
                          >
                            {t('orders.invoice.actions.pay')}
                          </Button>
                        )}
                        <Button
                          size='small'
                          variant='outlined'
                          startIcon={<i className='tabler-download' />}
                          onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                          disabled={downloading === invoice.id}
                        >
                          {downloading === invoice.id ? t('common.states.downloading') : t('orders.invoice.actions.downloadPdf')}
                        </Button>
                        <Button
                          size='small'
                          variant='outlined'
                          startIcon={<i className='tabler-send' />}
                          onClick={() => handleSendInvoice(invoice.id)}
                          disabled={sending === invoice.id}
                        >
                          {sending === invoice.id ? t('common.states.sending') : t('orders.invoice.actions.send')}
                        </Button>
                        <Button
                          size='small'
                          variant={canEdit ? 'contained' : 'outlined'}
                          startIcon={<i className={canEdit ? 'tabler-edit' : 'tabler-eye'} />}
                          onClick={() => handleEditInvoice(invoice)}
                          sx={canEdit ? {
                            boxShadow: 'none',
                            '&:hover': {
                              boxShadow: 'none'
                            }
                          } : {}}
                        >
                          {canEdit ? t('orders.invoice.actions.edit') : t('orders.invoice.actions.view')}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Invoice Edit Dialog */}
      <InvoiceEditDialog
        open={editDialogOpen}
        invoice={editingInvoice}
        customerId={customerId}
        orderId={order.id}
        onClose={() => {
          setEditDialogOpen(false)
          setEditingInvoice(null)
        }}
        onSave={handleSaveInvoice}
      />

      {/* Invoice View Dialog */}
      <InvoiceViewDialog
        open={viewDialogOpen}
        invoice={viewingInvoice}
        onClose={() => {
          setViewDialogOpen(false)
          setViewingInvoice(null)
        }}
      />

      {/* Snackbar for notifications */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, invoice: null })}>
        <DialogTitle>{t('orders.invoice.confirmDelete.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('orders.invoice.confirmDelete.message', { invoiceNumber: deleteDialog.invoice?.invoice_number || '' })} 
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, invoice: null })}>{t('common.actions.cancel')}</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color='error' 
            variant='contained'
            disabled={deleting !== null}
          >
            {deleting ? t('common.states.deleting') : t('orders.invoice.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default InvoiceCard
