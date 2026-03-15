'use client'

// React Imports
import { useState, useCallback } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// API
import { getProducts, updateOrderItems, type Product, type OrderItemUpdatePayload } from '@/services/store'

type OrderItem = {
  id: number
  product: number
  variant?: number | null
  product_name: string
  variant_name?: string
  sku?: string
  quantity: number
  price: number | string
  subtotal: number | string
}

type OrderDetail = {
  id: number
  order_number: string
  items?: OrderItem[]
  subtotal?: number
  shipping_cost?: number
  tax?: number
  discount?: number
  total: number
  freight_service?: {
    id: number
    name: string
    code: string
    carrier_name?: string
    estimated_days_min?: number
    estimated_days_max?: number
  } | null
}

type EditableLine = { product: number; variant?: number; product_name: string; variant_name?: string; sku?: string; price: number; quantity: number }

type OrderDetailsCardProps = {
  order: OrderDetail
  onOrderUpdate?: (updatedOrder: OrderDetail) => void
}

const OrderDetailsCard = ({ order, onOrderUpdate }: OrderDetailsCardProps) => {
  const t = useTranslations('admin')
  const items = order.items || []
  const subtotal = order.subtotal || 0
  const shippingCost = order.shipping_cost || 0
  const tax = order.tax || 0
  const discount = order.discount || 0
  const total = order.total || 0

  const [editing, setEditing] = useState(false)
  const [editLines, setEditLines] = useState<EditableLine[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productOptions, setProductOptions] = useState<Product[]>([])
  const [productLoading, setProductLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return `$${Number(numAmount).toFixed(2)}`
  }

  const startEditing = useCallback(() => {
    const lines: EditableLine[] = (order.items || []).map(item => ({
      product: item.product,
      variant: item.variant ?? undefined,
      product_name: item.product_name,
      variant_name: item.variant_name,
      sku: item.sku,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      quantity: item.quantity
    }))
    setEditLines(lines)
    setEditing(true)
    setError(null)
  }, [order.items])

  const cancelEditing = useCallback(() => {
    setEditing(false)
    setEditLines([])
    setProductSearch('')
    setError(null)
  }, [])

  const fetchProducts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProductOptions([])
      return
    }
    setProductLoading(true)
    try {
      const list = await getProducts({ search: q.trim(), page_size: 20 })
      setProductOptions(list)
    } catch {
      setProductOptions([])
    } finally {
      setProductLoading(false)
    }
  }, [])

  const addProduct = (product: Product | null, quantity: number) => {
    if (!product || quantity < 1) return
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price
    setEditLines(prev => {
      const idx = prev.findIndex(l => l.product === product.id && l.variant === undefined)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
        return next
      }
      return [...prev, {
        product: product.id,
        product_name: product.name,
        sku: product.sku,
        price,
        quantity
      }]
    })
    setProductSearch('')
    setProductOptions([])
  }

  const updateQuantity = (index: number, delta: number) => {
    setEditLines(prev =>
      prev.map((line, i) =>
        i === index ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line
      ).filter(l => l.quantity > 0)
    )
  }

  const removeLine = (index: number) => {
    setEditLines(prev => prev.filter((_, i) => i !== index))
  }

  const saveItems = async () => {
    if (editLines.length === 0) {
      setError(t('orders.detailsCard.edit.addAtLeastOne'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload: OrderItemUpdatePayload[] = editLines.map(l => ({
        product: l.product,
        ...(l.variant ? { variant: l.variant } : {}),
        quantity: l.quantity
      }))
      const updated = await updateOrderItems(order.id, payload) as OrderDetail
      setEditing(false)
      setEditLines([])
      onOrderUpdate?.(updated)
    } catch (err: any) {
      setError(err.message || t('orders.detailsCard.edit.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const displayItems = editing ? editLines : items
  const editSubtotal = editing
    ? editLines.reduce((sum, l) => sum + l.price * l.quantity, 0)
    : subtotal

  return (
    <Card>
      <CardHeader
        title={t('orders.detailsCard.title')}
        action={
          !editing ? (
            <Button size='small' variant='outlined' startIcon={<i className='tabler-edit' />} onClick={startEditing}>
              {t('orders.detailsCard.edit.editItems')}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size='small' onClick={cancelEditing} disabled={saving}>
                {t('common.actions.cancel')}
              </Button>
              <Button size='small' variant='contained' onClick={saveItems} disabled={saving}>
                {saving ? t('common.states.saving') : t('orders.detailsCard.edit.save')}
              </Button>
            </Box>
          )
        }
      />
      <CardContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {editing && (
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              freeSolo
              options={productOptions}
              getOptionLabel={opt => (typeof opt === 'string' ? opt : `${opt.name} ${opt.sku ? `(${opt.sku})` : ''}`)}
              inputValue={productSearch}
              onInputChange={(_, value) => {
                setProductSearch(value)
                fetchProducts(value)
              }}
              loading={productLoading}
              renderInput={params => (
                <TextField
                  {...params}
                  size='small'
                  placeholder={t('orders.createOrderModal.productSearchPlaceholder')}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: productLoading ? <CircularProgress color='inherit' size={20} /> : null
                  }}
                />
              )}
              onChange={(_, value) => {
                const product = value as Product
                if (product?.id) addProduct(product, 1)
              }}
            />
          </Box>
        )}
        {displayItems.length === 0 ? (
          <Typography variant='body2' color='text.secondary'>
            {t('orders.detailsCard.empty')}
          </Typography>
        ) : (
          <>
            <TableContainer component={Paper} variant='outlined' sx={{ mb: 3 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>{t('orders.detailsCard.table.headers.product')}</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, minWidth: 100 }}>
                      {t('orders.detailsCard.table.headers.price')}
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, minWidth: 100 }}>
                      {t('orders.detailsCard.table.headers.quantity')}
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600, minWidth: 100 }}>
                      {t('orders.detailsCard.table.headers.total')}
                    </TableCell>
                    {editing && <TableCell sx={{ width: 56 }} />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(editing ? editLines : items).map((item, index) => (
                    <TableRow key={editing ? index : (item as OrderItem).id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {'product_name' in item ? item.product_name : (item as OrderItem).product_name}
                          </Typography>
                          {('variant_name' in item && item.variant_name) && (
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {item.variant_name}
                            </Typography>
                          )}
                          {('sku' in item && item.sku) && (
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {t('orders.detailsCard.table.values.sku')}: {item.sku}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
                        {formatCurrency('price' in item ? item.price : (item as OrderItem).price)}
                      </TableCell>
                      <TableCell align='right'>
                        {editing ? (
                          <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton size='small' onClick={() => updateQuantity(index, -1)}>
                              <i className='tabler-minus' style={{ fontSize: 16 }} />
                            </IconButton>
                            {(item as EditableLine).quantity}
                            <IconButton size='small' onClick={() => updateQuantity(index, 1)}>
                              <i className='tabler-plus' style={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        ) : (
                          (item as OrderItem).quantity
                        )}
                      </TableCell>
                      <TableCell align='right' sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                        {editing
                          ? formatCurrency((item as EditableLine).price * (item as EditableLine).quantity)
                          : formatCurrency((item as OrderItem).subtotal)}
                      </TableCell>
                      {editing && (
                        <TableCell>
                          <IconButton size='small' onClick={() => removeLine(index)}>
                            <i className='tabler-trash' style={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ minWidth: 250 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant='body2' color='text.secondary'>
                          {t('orders.detailsCard.summary.subtotal')}:
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 500 }}>
                          {formatCurrency(editing ? editSubtotal : subtotal)}
                        </Typography>
                      </Box>
                      {shippingCost > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {t('orders.detailsCard.summary.shipping')}:
                          </Typography>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {formatCurrency(shippingCost)}
                          </Typography>
                        </Box>
                      )}
                      {tax > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {t('orders.detailsCard.summary.tax')}:
                          </Typography>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            {formatCurrency(tax)}
                          </Typography>
                        </Box>
                      )}
                      {discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {t('orders.detailsCard.summary.discount')}:
                          </Typography>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>
                            -{formatCurrency(discount)}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant='body1' sx={{ fontWeight: 600 }}>
                          {t('orders.detailsCard.summary.total')}:
                        </Typography>
                        <Typography variant='body1' sx={{ fontWeight: 600 }}>
                          {formatCurrency(total)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default OrderDetailsCard
