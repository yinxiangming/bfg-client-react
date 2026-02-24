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
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import { useTheme } from '@mui/material/styles'

import { getIntlLocale } from '@/utils/format'

// Component Imports
import { Icon } from '@iconify/react'

// Utils Imports
import { meApi } from '@/utils/meApi'

// Component Imports
import InvoiceViewDialog from '@/components/invoice/InvoiceViewDialog'

// Service Imports
import { type Invoice as InvoiceType } from '@/services/finance'

interface Invoice {
  id: number
  invoice_number: string
  status: string
  subtotal: string | number | null | undefined
  tax: string | number | null | undefined
  total: string | number | null | undefined
  currency?: {
    code: string
    symbol: string
  } | null
  issue_date: string
  due_date?: string | null
  paid_date?: string | null
  order?: number
}

interface InvoicesCardProps {
  orderId: number
  order?: {
    id: number
    customer?: number | { id: number }
  }
}

const invoiceStatusColors: { [key: string]: 'success' | 'warning' | 'error' | 'info' | 'default' } = {
  paid: 'success',
  sent: 'info',
  draft: 'default',
  overdue: 'error',
  cancelled: 'error'
}

const InvoicesCard = ({ orderId }: InvoicesCardProps) => {
  const t = useTranslations('account.orderDetail')
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState<number | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceType | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    fetchInvoices()
  }, [orderId])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await meApi.getInvoices({ order_id: orderId })
      const invoicesList = response.results || response.data || response || []
      setInvoices(Array.isArray(invoicesList) ? invoicesList : [])
    } catch (err: any) {
      setError(err.message || t('failedLoadInvoices'))
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      setSending(invoiceId)
      const response = await meApi.sendInvoice(invoiceId)
      setSnackbar({
        open: true,
        message: response.message || t('invoiceSent'),
        severity: 'success'
      })
      // Refresh invoices
      fetchInvoices()
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || t('failedSendInvoice'),
        severity: 'error'
      })
    } finally {
      setSending(null)
    }
  }

  const handleViewInvoice = async (invoiceId: number) => {
    try {
      const fullInvoice = await meApi.getInvoice(invoiceId)
      setViewingInvoice(fullInvoice as InvoiceType)
      setViewDialogOpen(true)
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || t('failedLoad'),
        severity: 'error'
      })
    }
  }

  const handleDownloadInvoice = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const blob = await meApi.downloadInvoice(invoiceId)
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
        message: err.message || t('failedLoad'),
        severity: 'error'
      })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return t('na')
    const date = new Date(dateString)
    return date.toLocaleDateString(getIntlLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  // Get translated invoice status
  const getInvoiceStatusText = (status: string) => {
    if (!status) return t('statusDraft')
    const normalizedStatus = status.toLowerCase()
    const statusMap: { [key: string]: string } = {
      'paid': 'statusPaid',
      'sent': 'statusSent',
      'draft': 'statusDraft',
      'overdue': 'statusOverdue',
      'cancelled': 'statusCancelled'
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
          title={t('invoices')}
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
          ) : invoices.length === 0 ? (
            <Alert severity='info'>{t('noInvoices')}</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {invoices.map((invoice) => (
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
                    <Box>
                      <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 0.5 }}>
                        {invoice.invoice_number}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          label={getInvoiceStatusText(invoice.status)}
                          size='small'
                          {...(isDarkMode ? {} : { color: invoiceStatusColors[invoice.status] || 'default' })}
                          sx={[
                            {
                              fontSize: '0.75rem'
                            },
                            isDarkMode && {
                              backgroundColor: getStatusBgColor(invoiceStatusColors[invoice.status] || 'default'),
                              color: getStatusTextColor(invoiceStatusColors[invoice.status] || 'default'),
                              '& .MuiChip-label': {
                                color: getStatusTextColor(invoiceStatusColors[invoice.status] || 'default')
                              }
                            },
                            !isDarkMode && {
                              backgroundColor: getStatusBgColor(invoiceStatusColors[invoice.status] || 'default'),
                              color: getStatusTextColor(invoiceStatusColors[invoice.status] || 'default'),
                              '& .MuiChip-label': {
                                color: getStatusTextColor(invoiceStatusColors[invoice.status] || 'default')
                              }
                            }
                          ]}
                        />
                        <Typography variant='body2' color='text.secondary'>
                          {t('issueDate')}: {formatDate(invoice.issue_date)}
                        </Typography>
                        {invoice.due_date && (
                          <Typography variant='body2' color='text.secondary'>
                            {t('dueDate')}: {formatDate(invoice.due_date)}
                          </Typography>
                        )}
                        {invoice.paid_date && (
                          <Typography variant='body2' color='success.main'>
                            {t('paidDate')}: {formatDate(invoice.paid_date)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant='h6' sx={{ fontWeight: 600, mb: 0.5 }}>
                        {formatAmount(invoice.total, invoice.currency ?? undefined)}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {t('subtotal')}: {formatAmount(invoice.subtotal, invoice.currency ?? undefined)}
                      </Typography>
                      {invoice.tax && parseFloat(String(invoice.tax || 0)) > 0 && (
                        <Typography variant='body2' color='text.secondary'>
                          {t('tax')}: {formatAmount(invoice.tax, invoice.currency ?? undefined)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      size='small'
                      variant='outlined'
                      startIcon={<Icon icon='tabler-eye' />}
                      onClick={() => handleViewInvoice(invoice.id)}
                    >
                      {t('viewInvoice')}
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size='small'
                        variant='outlined'
                        startIcon={<Icon icon='tabler-download' />}
                        onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                      >
                        {t('downloadPdf')}
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        startIcon={<Icon icon='tabler-send' />}
                        onClick={() => handleSendInvoice(invoice.id)}
                        disabled={sending === invoice.id}
                      >
                        {sending === invoice.id ? t('sending') : t('send')}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Invoice View Dialog */}
      <InvoiceViewDialog
        open={viewDialogOpen}
        invoice={viewingInvoice}
        onClose={() => {
          setViewDialogOpen(false)
          setViewingInvoice(null)
        }}
      />

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

export default InvoicesCard
