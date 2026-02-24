'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
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

// Component Imports
import { Icon } from '@iconify/react'

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
  type Invoice,
  type InvoiceCreatePayload
} from '@/services/finance'

type InvoiceItem = {
  description: string
  quantity: number
  unit_price: number
  financial_code?: number | null
  tax_rate?: number
}

type InvoiceEditDialogProps = {
  open: boolean
  invoice?: Invoice | null
  customerId: number
  orderId?: number
  onClose: () => void
  onSave: (data: InvoiceCreatePayload) => Promise<void>
}

const InvoiceEditDialog = ({
  open,
  invoice,
  customerId,
  orderId,
  onClose,
  onSave
}: InvoiceEditDialogProps) => {
  const [loading, setLoading] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [financialCodes, setFinancialCodes] = useState<FinancialCode[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [brand, setBrand] = useState<number | ''>('')
  const [currency, setCurrency] = useState<number | ''>('')
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('draft')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])

  // Only paid and cancelled invoices cannot be edited
  const isEditable = !invoice || (invoice.status !== 'paid' && invoice.status !== 'cancelled')
  const isEdit = !!invoice

  useEffect(() => {
    if (open) {
      if (invoice) {
        // Load invoice data
        setBrand(
          invoice.brand
            ? typeof invoice.brand === 'object'
              ? invoice.brand.id
              : invoice.brand
            : ''
        )
        setCurrency(typeof invoice.currency === 'object' ? invoice.currency.id : invoice.currency)
        setStatus(invoice.status)
        setIssueDate(invoice.issue_date)
        setDueDate(invoice.due_date || '')
        setNotes(invoice.notes || '')
        setItems(
          invoice.items?.map(item => ({
            description: item.description,
            quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
            unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
            financial_code: typeof item.financial_code === 'object' ? item.financial_code?.id : item.financial_code || null,
            tax_rate: 0
          })) || []
        )
      } else {
        // Reset form for new invoice
        const today = new Date().toISOString().split('T')[0]
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        setBrand('')
        setCurrency('')
        setStatus('draft')
        setIssueDate(today)
        setDueDate(dueDate)
        setNotes('')
        setItems([{ description: '', quantity: 1, unit_price: 0, financial_code: null, tax_rate: 0 }])
      }
      fetchData()
    }
  }, [open, invoice])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [brandsData, currenciesData, financialCodesData, taxRatesData] = await Promise.all([
        getBrands(),
        getCurrencies(),
        getFinancialCodes(),
        getTaxRates()
      ])
      // Brand model doesn't have is_active field, so use all brands
      const activeCurrencies = currenciesData.filter(c => c.is_active)
      
      setBrands(brandsData) // All brands from workspace
      setCurrencies(activeCurrencies)
      setFinancialCodes(financialCodesData.filter(fc => fc.is_active))
      setTaxRates(taxRatesData.filter(tr => tr.is_active))
      
      // Set default currency if not set (only for new invoice)
      if (!invoice && !currency && activeCurrencies.length > 0) {
        const defaultCurrency = activeCurrencies.find(c => c.is_active) || activeCurrencies[0]
        if (defaultCurrency) {
          setCurrency(defaultCurrency.id)
        }
      }
      
      // Set default brand if not set (only for new invoice)
      // Default to is_default brand, or first brand if no default
      if (!invoice && !brand && brandsData.length > 0) {
        const defaultBrand = brandsData.find(b => b.is_default) || brandsData[0]
        if (defaultBrand) {
          setBrand(defaultBrand.id)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, financial_code: null, tax_rate: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      
      if (!currency) {
        setError('Please select a currency')
        return
      }

      if (items.length === 0 || items.some(item => !item.description || item.quantity <= 0 || item.unit_price < 0)) {
        setError('Please fill in all item fields correctly')
        return
      }

      const payload: InvoiceCreatePayload = {
        customer: customerId,
        order: orderId,
        currency: currency as number,
        brand: brand ? (brand as number) : undefined,
        status,
        issue_date: issueDate,
        due_date: dueDate || undefined,
        notes: notes || undefined,
        items: items.map(item => {
          const financialCode = financialCodes.find(fc => fc.id === item.financial_code)
          const taxType = financialCode?.tax_type || 'default'
          
          return {
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            financial_code_id: item.financial_code || undefined,
            tax_type: taxType
          }
        })
      }

      await onSave(payload)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice')
    }
  }

  const getWorkspaceTaxRate = (): number => {
    // Get active tax rate (percentage, e.g., 15 for 15%)
    const activeTaxRate = taxRates.find(tr => tr.is_active)
    return activeTaxRate ? activeTaxRate.rate / 100 : 0 // Convert to decimal
  }

  const getItemTaxType = (item: InvoiceItem): 'default' | 'no_tax' | 'zero_gst' => {
    if (!item.financial_code) return 'default'
    const financialCode = financialCodes.find(fc => fc.id === item.financial_code)
    return financialCode?.tax_type || 'default'
  }

  const calculateItemTax = (item: InvoiceItem): number => {
    const subtotal = item.quantity * item.unit_price
    const taxType = getItemTaxType(item)
    
    if (taxType === 'no_tax' || taxType === 'zero_gst') {
      return 0
    }
    
    // 'default' - use workspace tax rate
    const taxRate = getWorkspaceTaxRate()
    return subtotal * taxRate
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => sum + calculateItemTax(item), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax()
  }

  const selectedCurrency = currencies.find(c => c.id === currency)

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Invoice' : 'Create Invoice'}
        {!isEditable && (
          <Alert severity='info' sx={{ mt: 1 }}>
            This invoice is {invoice?.status} and cannot be edited
          </Alert>
        )}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {error && (
              <Alert severity='error' onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth disabled={!isEditable}>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={brand}
                  label='Brand'
                  onChange={(e) => setBrand(e.target.value as number | '')}
                >
                  <MenuItem value=''>
                    <em>None</em>
                  </MenuItem>
                  {brands.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required disabled={!isEditable}>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  label='Currency'
                  onChange={(e) => setCurrency(e.target.value as number | '')}
                >
                  {currencies.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.code} ({c.symbol})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!isEditable}>
                <InputLabel>Status</InputLabel>
                <Select value={status} label='Status' onChange={(e) => setStatus(e.target.value as any)}>
                  <MenuItem value='draft'>Draft</MenuItem>
                  <MenuItem value='sent'>Sent</MenuItem>
                  <MenuItem value='paid'>Paid</MenuItem>
                  <MenuItem value='overdue'>Overdue</MenuItem>
                  <MenuItem value='cancelled'>Cancelled</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label='Issue Date'
                type='date'
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditable}
                required
              />

              <TextField
                fullWidth
                label='Due Date'
                type='date'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditable}
              />

              <TextField
                fullWidth
                label='Notes'
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!isEditable}
              />
            </Box>

            <Divider />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='h6'>Items</Typography>
                {isEditable && (
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<Icon icon='tabler-plus' />}
                    onClick={handleAddItem}
                  >
                    Add Item
                  </Button>
                )}
              </Box>

              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell sx={{ width: 180 }}>
                        Financial Code
                      </TableCell>
                      <TableCell align='right' sx={{ width: 120 }}>
                        Quantity
                      </TableCell>
                      <TableCell align='right' sx={{ width: 150 }}>
                        Unit Price
                      </TableCell>
                      <TableCell align='right' sx={{ width: 100 }}>
                        Tax
                      </TableCell>
                      <TableCell align='right' sx={{ width: 150 }}>
                        Subtotal
                      </TableCell>
                      {isEditable && <TableCell align='center' sx={{ width: 80 }}></TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => {
                      const subtotal = item.quantity * item.unit_price
                      const tax = calculateItemTax(item)
                      const selectedFinancialCode = financialCodes.find(fc => fc.id === item.financial_code)
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              fullWidth
                              size='small'
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              disabled={!isEditable}
                              placeholder='Item description'
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size='small' disabled={!isEditable}>
                              <Select
                                value={item.financial_code || ''}
                                onChange={(e) => {
                                  const financialCodeId = e.target.value || null
                                  const selectedCode = financialCodes.find(fc => fc.id === financialCodeId)
                                  
                                  // Update financial_code
                                  handleItemChange(index, 'financial_code', financialCodeId)
                                  
                                  // If description is empty, set it from financial code name
                                  if (selectedCode && !item.description) {
                                    handleItemChange(index, 'description', selectedCode.name)
                                  }
                                  
                                  // If unit_price is 0 or empty, set it from financial code
                                  if (selectedCode && selectedCode.unit_price && (item.unit_price === 0 || !item.unit_price)) {
                                    const unitPrice = typeof selectedCode.unit_price === 'string' 
                                      ? parseFloat(selectedCode.unit_price) 
                                      : selectedCode.unit_price
                                    if (unitPrice) {
                                      handleItemChange(index, 'unit_price', unitPrice)
                                    }
                                  }
                                }}
                                displayEmpty
                              >
                                <MenuItem value=''>
                                  <em>None</em>
                                </MenuItem>
                                {financialCodes.map((fc) => (
                                  <MenuItem key={fc.id} value={fc.id}>
                                    {fc.code} - {fc.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {selectedFinancialCode && (
                              <Box>
                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                                  Tax: {selectedFinancialCode.tax_type === 'default' ? 'Default' : selectedFinancialCode.tax_type === 'no_tax' ? 'No Tax' : 'Zero GST'}
                                </Typography>
                                {selectedFinancialCode.unit && (
                                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                                    Unit: {selectedFinancialCode.unit}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align='right'>
                            <TextField
                              type='number'
                              size='small'
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              disabled={!isEditable}
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align='right'>
                            <TextField
                              type='number'
                              size='small'
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              disabled={!isEditable}
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ width: 130 }}
                            />
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='body2'>
                              {selectedCurrency?.symbol || '$'}
                              {tax.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Typography>
                              {selectedCurrency?.symbol || '$'}
                              {subtotal.toFixed(2)}
                            </Typography>
                          </TableCell>
                          {isEditable && (
                            <TableCell align='center'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => handleRemoveItem(index)}
                                disabled={items.length === 1}
                              >
                                <Icon icon='tabler-trash' />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                    <TableRow>
                      <TableCell colSpan={5} align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          Subtotal:
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          {selectedCurrency?.symbol || '$'}
                          {calculateSubtotal().toFixed(2)}
                        </Typography>
                      </TableCell>
                      {isEditable && <TableCell></TableCell>}
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          Tax:
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                          {selectedCurrency?.symbol || '$'}
                          {calculateTotalTax().toFixed(2)}
                        </Typography>
                      </TableCell>
                      {isEditable && <TableCell></TableCell>}
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, fontSize: '1rem' }}>
                          Total:
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='subtitle2' sx={{ fontWeight: 600, fontSize: '1rem' }}>
                          {selectedCurrency?.symbol || '$'}
                          {calculateTotal().toFixed(2)}
                        </Typography>
                      </TableCell>
                      {isEditable && <TableCell></TableCell>}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {isEditable && (
          <Button variant='contained' onClick={handleSubmit} disabled={loading}>
            {isEdit ? 'Update' : 'Create'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default InvoiceEditDialog
