'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

import { getIntlLocale } from '@/utils/format'

// Service Imports
import {
  getBrands,
  getCurrencies,
  getFinancialCodes,
  getTaxRates,
  type Brand,
  type Currency,
  type FinancialCode,
  type TaxRate,
  type Invoice
} from '@/services/finance'

type InvoiceViewDialogProps = {
  open: boolean
  invoice: Invoice | null
  onClose: () => void
}

const InvoiceViewDialog = ({
  open,
  invoice,
  onClose
}: InvoiceViewDialogProps) => {
  const t = useTranslations('account.orderDetail')
  const theme = useTheme()
  const isDarkMode = theme.palette.mode === 'dark'
  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [financialCodes, setFinancialCodes] = useState<FinancialCode[]>([])

  useEffect(() => {
    if (open && invoice) {
      fetchData()
    }
  }, [open, invoice])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [brandsData, currenciesData, financialCodesData] = await Promise.all([
        getBrands(),
        getCurrencies(),
        getFinancialCodes()
      ])
      setBrands(brandsData)
      setCurrencies(currenciesData.filter(c => c.is_active))
      setFinancialCodes(financialCodesData.filter(fc => fc.is_active))
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getBrandName = (brandId?: number | { id: number; name: string } | null) => {
    if (!brandId) return t('na')
    if (typeof brandId === 'object') return brandId.name
    const brand = brands.find(b => b.id === brandId)
    return brand?.name || t('na')
  }

  const getCurrency = () => {
    if (!invoice) return null
    if (typeof invoice.currency === 'object') return invoice.currency
    return currencies.find(c => c.id === invoice.currency) || null
  }

  const getFinancialCodeName = (financialCodeId?: number | { id: number; code: string; name: string } | null) => {
    if (!financialCodeId) return t('na')
    if (typeof financialCodeId === 'object') return `${financialCodeId.code} - ${financialCodeId.name}`
    const fc = financialCodes.find(f => f.id === financialCodeId)
    return fc ? `${fc.code} - ${fc.name}` : t('na')
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t('na')
    return new Date(dateString).toLocaleDateString(getIntlLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: string | number | undefined | null) => {
    const currency = getCurrency()
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

  if (!invoice) return null

  const currency = getCurrency()
  const invoiceStatusColors: { [key: string]: 'success' | 'warning' | 'error' | 'info' | 'default' } = {
    paid: 'success',
    sent: 'info',
    draft: 'default',
    overdue: 'error',
    cancelled: 'error'
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6'>{t('invoiceDetails')}</Typography>
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
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Invoice Info */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t('invoiceNumber')}</Typography>
                <Typography variant='body1' sx={{ fontWeight: 600 }}>{invoice.invoice_number}</Typography>
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t('brand')}</Typography>
                <Typography variant='body1'>{getBrandName(invoice.brand)}</Typography>
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t('currency')}</Typography>
                <Typography variant='body1'>{currency?.code || t('na')}</Typography>
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t('status')}</Typography>
                <Typography variant='body1'>{getInvoiceStatusText(invoice.status)}</Typography>
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t('issueDate')}</Typography>
                <Typography variant='body1'>{formatDate(invoice.issue_date)}</Typography>
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t('dueDate')}</Typography>
                <Typography variant='body1'>{formatDate(invoice.due_date)}</Typography>
              </Box>
              {invoice.sent_date && (
                <Box>
                  <Typography variant='caption' color='text.secondary'>{t('sentDate')}</Typography>
                  <Typography variant='body1'>{formatDate(invoice.sent_date)}</Typography>
                </Box>
              )}
              {invoice.paid_date && (
                <Box>
                  <Typography variant='caption' color='text.secondary'>{t('paidDate')}</Typography>
                  <Typography variant='body1' color='success.main'>{formatDate(invoice.paid_date)}</Typography>
                </Box>
              )}
            </Box>

            {invoice.notes && (
              <Box>
                <Typography variant='caption' color='text.secondary'>{t('notes')}</Typography>
                <Typography variant='body2' sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{invoice.notes}</Typography>
              </Box>
            )}

            <Divider />

            {/* Items */}
            <Box>
              <Typography variant='h6' sx={{ mb: 2 }}>{t('items')}</Typography>
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('description')}</TableCell>
                      <TableCell>{t('financialCode')}</TableCell>
                      <TableCell align='right'>{t('quantity')}</TableCell>
                      <TableCell align='right'>{t('unitPrice')}</TableCell>
                      <TableCell align='right'>{t('tax')}</TableCell>
                      <TableCell align='right'>{t('subtotal')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items?.map((item, index) => {
                      const subtotal = typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : item.subtotal
                      const tax = typeof item.tax === 'string' ? parseFloat(item.tax) : item.tax
                      return (
                        <TableRow key={item.id || index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>
                            <Typography variant='body2' color='text.secondary'>
                              {getFinancialCodeName(item.financial_code)}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>{item.quantity}</TableCell>
                          <TableCell align='right'>{formatAmount(item.unit_price)}</TableCell>
                          <TableCell align='right'>{formatAmount(tax)}</TableCell>
                          <TableCell align='right'>{formatAmount(subtotal)}</TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow>
                      <TableCell colSpan={5} align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          {t('subtotal')}:
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          {formatAmount(invoice.subtotal)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          {t('tax')}:
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          {formatAmount(invoice.tax)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, fontSize: '1rem' }}>
                          {t('total')}:
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, fontSize: '1rem' }}>
                          {formatAmount(invoice.total)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default InvoiceViewDialog
