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
import Button from '@mui/material/Button'
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

interface Invoice {
  id: number
  invoice_number: string
  order_id?: number
  order_number?: string
  amount: string | number
  currency?: string | number  // Can be currency code (string) or currency ID (number)
  status: string
  issue_date: string
  due_date?: string
  download_url?: string
}

const Invoices = () => {
  const t = useTranslations('account.payments')
  
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await meApi.getInvoices()
      const invoiceList = response.results || response.data || []
      setInvoices(Array.isArray(invoiceList) ? invoiceList : [])
    } catch (err: any) {
      setError(err.message || t('failedLoad'))
      console.error('Failed to fetch invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (invoiceId: number) => {
    try {
      setDownloading(invoiceId)
      setError(null)

      const blob = await meApi.downloadInvoice(invoiceId)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Get invoice to get invoice number for filename
      const invoice = invoices.find(inv => inv.id === invoiceId)
      const filename = invoice
        ? `invoice-${invoice.invoice_number}.pdf`
        : `invoice-${invoiceId}.pdf`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || t('failedLoad'))
      console.error('Failed to download invoice:', err)
    } finally {
      setDownloading(null)
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
        day: 'numeric'
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

  if (loading && invoices.length === 0) {
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
        <Typography variant='h6' sx={{ mb: 1 }}>
          {t('invoices')}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          {t('downloadInvoices')}
        </Typography>
      </Grid>

      {invoices.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant='body1' sx={{ mb: 2 }}>
                  {t('noInvoices')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('noInvoicesHint')}
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
                  <TableCell>{t('invoiceNumber')}</TableCell>
                  <TableCell>{t('order')}</TableCell>
                  <TableCell>{t('issueDate')}</TableCell>
                  <TableCell>{t('dueDate')}</TableCell>
                  <TableCell>{t('amount')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                  <TableCell align='right'>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Typography variant='body2' className='font-semibold'>
                        {invoice.invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {invoice.order_id ? (
                        <Link href={`/account/orders/${invoice.order_id}`} underline='hover'>
                          {invoice.order_number || `#${invoice.order_id}`}
                        </Link>
                      ) : (
                        t('date')
                      )}
                    </TableCell>
                    <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date || '')}</TableCell>
                    <TableCell>
                      <Typography variant='body2' className='font-semibold'>
                        {formatAmount(invoice.amount, invoice.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        size='small'
                        color={invoice.status === 'paid' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => handleDownload(invoice.id)}
                        disabled={downloading === invoice.id}
                        startIcon={
                          downloading === invoice.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <i className='tabler-download' />
                          )
                        }
                      >
                        {downloading === invoice.id ? t('downloading') : t('download')}
                      </Button>
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

export default Invoices

