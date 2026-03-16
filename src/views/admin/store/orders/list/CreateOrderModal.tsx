'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import {
  getProducts,
  getCustomers,
  getCustomerAddresses,
  createAddress,
  createOrder,
  updateOrderItems,
  getStores,
  createCustomer,
  type Product,
  type Customer,
  type CreateOrderPayload,
  type OrderItemUpdatePayload
} from '@/services/store'

export type CreateOrderModalProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type LineItem = { product: Product; quantity: number }

const PLACEHOLDER_ADDRESS = {
  address_line1: '—',
  city: '—',
  postal_code: '—'
}

export default function CreateOrderModal({ open, onClose, onSuccess }: CreateOrderModalProps) {
  const t = useTranslations('admin')
  const router = useRouter()
  const [productSearch, setProductSearch] = useState('')
  const [productOptions, setProductOptions] = useState<Product[]>([])
  const [productLoading, setProductLoading] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [createNewCustomer, setCreateNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const fetchCustomers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setCustomerOptions([])
      return
    }
    setCustomerLoading(true)
    try {
      const list = await getCustomers({ search: q.trim() })
      setCustomerOptions(list)
    } catch {
      setCustomerOptions([])
    } finally {
      setCustomerLoading(false)
    }
  }, [])

  const handleProductSearchChange = (_: unknown, value: string) => {
    setProductSearch(value)
    fetchProducts(value)
  }

  const handleAddProduct = (product: Product | null, quantity: number) => {
    if (!product || quantity < 1) return
    setLineItems(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
        return next
      }
      return [...prev, { product, quantity }]
    })
    setProductSearch('')
    setProductOptions([])
  }

  const handleCustomerSearchChange = (_: unknown, value: string) => {
    setCustomerSearch(value)
    setCreateNewCustomer(false)
    fetchCustomers(value)
  }

  const handleRemoveLine = (productId: number) => {
    setLineItems(prev => prev.filter(i => i.product.id !== productId))
  }

  const handleQuantityChange = (productId: number, delta: number) => {
    setLineItems(prev =>
      prev.map(i =>
        i.product.id === productId
          ? { ...i, quantity: Math.max(0, i.quantity + delta) }
          : i
      ).filter(i => i.quantity > 0)
    )
  }

  const ensureShippingAddress = async (
    customerId: number,
    contact: { phone: string; full_name: string }
  ): Promise<number> => {
    const addresses = await getCustomerAddresses(customerId)
    if (addresses.length > 0) {
      return addresses[0].id
    }
    const created = await createAddress({
      customer_id: customerId,
      ...PLACEHOLDER_ADDRESS,
      phone: contact.phone || '—',
      full_name: contact.full_name || '—'
    })
    return created.id
  }

  const handleSubmit = async () => {
    setError(null)
    let customerId: number | null = null

    if (createNewCustomer) {
      if (!newCustomerEmail?.trim() && !newCustomerPhone?.trim()) {
        setError(t('orders.createOrderModal.errors.customerEmailOrPhone'))
        return
      }
      try {
        const created = await createCustomer({
          user_email: newCustomerEmail?.trim() || undefined,
          company_name: newCustomerName?.trim() || undefined
        })
        customerId = created.id
      } catch (err: any) {
        setError(err.message || t('orders.createOrderModal.errors.createCustomerFailed'))
        return
      }
    } else {
      if (!selectedCustomer) {
        setError(t('orders.createOrderModal.errors.selectCustomer'))
        return
      }
      customerId = selectedCustomer.id
    }

    if (!customerId) {
      setError(t('orders.createOrderModal.errors.selectCustomer'))
      return
    }

    if (lineItems.length === 0) {
      setError(t('orders.createOrderModal.errors.addAtLeastOneProduct'))
      return
    }

    setSubmitting(true)
    try {
      const contact = createNewCustomer
        ? { phone: newCustomerPhone?.trim() || '—', full_name: newCustomerName?.trim() || '—' }
        : {
            phone: selectedCustomer?.user?.phone?.trim() || '—',
            full_name:
              (selectedCustomer?.user?.first_name && selectedCustomer?.user?.last_name
                ? `${selectedCustomer.user.first_name} ${selectedCustomer.user.last_name}`.trim()
                : '') || selectedCustomer?.user_email || selectedCustomer?.user?.email || '—'
          }
      const shippingAddressId = await ensureShippingAddress(customerId, contact)
      const stores = await getStores()
      const storeId = stores.length > 0 ? stores[0].id : 1

      const payload: CreateOrderPayload = {
        customer_id: customerId,
        store_id: storeId,
        shipping_address_id: shippingAddressId
      }
      const order = await createOrder(payload)

      const items: OrderItemUpdatePayload[] = lineItems.map(({ product, quantity }) => ({
        product: product.id,
        quantity
      }))
      await updateOrderItems(order.id, items)

      onClose()
      onSuccess?.()
      router.push(`/admin/store/orders/${order.id}/edit`)
    } catch (err: any) {
      setError(err.message || t('orders.createOrderModal.errors.createOrderFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setProductSearch('')
      setCustomerSearch('')
      setLineItems([])
      setSelectedCustomer(null)
      setCreateNewCustomer(false)
      setNewCustomerName('')
      setNewCustomerEmail('')
      setNewCustomerPhone('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>{t('orders.createOrderModal.title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant='subtitle2' color='text.secondary' sx={{ mt: 1, mb: 1 }}>
          {t('orders.createOrderModal.products')}
        </Typography>
        <Autocomplete
          freeSolo
          options={productOptions}
          getOptionLabel={opt => (typeof opt === 'string' ? opt : `${opt.name} ${opt.sku ? `(${opt.sku})` : ''}`)}
          inputValue={productSearch}
          onInputChange={handleProductSearchChange}
          loading={productLoading}
          renderInput={params => (
            <TextField
              {...params}
              size='small'
              placeholder={t('orders.createOrderModal.productSearchPlaceholder')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {productLoading ? <CircularProgress color='inherit' size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{option.name} {option.sku && `(${option.sku})`}</span>
                <span style={{ marginLeft: 8 }}>${Number(option.price).toFixed(2)}</span>
              </Box>
            </li>
          )}
          onChange={(_, value) => {
            const product = value as Product
            if (product?.id) handleAddProduct(product, 1)
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <TextField
            type='number'
            size='small'
            sx={{ width: 80 }}
            inputProps={{ min: 1 }}
            defaultValue={1}
            onBlur={e => {
              const v = parseInt(e.target.value, 10)
              if (!isNaN(v) && v >= 1 && productSearch) {
                const p = productOptions.find(x => `${x.name} ${x.sku || ''}`.startsWith(productSearch))
                if (p) handleAddProduct(p, v)
              }
            }}
          />
          <Button
            size='small'
            variant='outlined'
            onClick={() => {
              const p = productOptions[0]
              if (p) handleAddProduct(p, 1)
            }}
            disabled={productOptions.length === 0}
          >
            {t('orders.createOrderModal.addProduct')}
          </Button>
        </Box>

        {lineItems.length > 0 && (
          <Table size='small' sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('orders.detailsCard.table.headers.product')}</TableCell>
                <TableCell align='right'>{t('orders.detailsCard.table.headers.quantity')}</TableCell>
                <TableCell align='right'>{t('orders.detailsCard.table.headers.total')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.map(({ product, quantity }) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name} {product.sku && `(${product.sku})`}</TableCell>
                  <TableCell align='right'>
                    <IconButton size='small' onClick={() => handleQuantityChange(product.id, -1)}>
                      <i className='tabler-minus' style={{ fontSize: 16 }} />
                    </IconButton>
                    {quantity}
                    <IconButton size='small' onClick={() => handleQuantityChange(product.id, 1)}>
                      <i className='tabler-plus' style={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                  <TableCell align='right'>${(Number(product.price) * quantity).toFixed(2)}</TableCell>
                  <TableCell>
                    <IconButton size='small' onClick={() => handleRemoveLine(product.id)}>
                      <i className='tabler-trash' style={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Typography variant='subtitle2' color='text.secondary' sx={{ mt: 3, mb: 1 }}>
          {t('orders.createOrderModal.customer')}
        </Typography>
        {!createNewCustomer ? (
          <>
            <Autocomplete
              options={customerOptions}
              getOptionLabel={opt =>
                (opt.user?.first_name && opt.user?.last_name
                  ? `${opt.user.first_name} ${opt.user.last_name}`.trim()
                  : '') || opt.user_email || opt.user?.email || `Customer #${opt.id}`
              }
              inputValue={customerSearch}
              onInputChange={handleCustomerSearchChange}
              loading={customerLoading}
              value={selectedCustomer}
              onChange={(_, val) => setSelectedCustomer(val)}
              renderInput={params => (
                <TextField
                  {...params}
                  size='small'
                  placeholder={t('orders.createOrderModal.customerSearchPlaceholder')}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {customerLoading ? <CircularProgress color='inherit' size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
            <Button
              size='small'
              sx={{ mt: 1 }}
              onClick={() => setCreateNewCustomer(true)}
            >
              {t('orders.createOrderModal.createNewCustomer')}
            </Button>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              size='small'
              label={t('orders.createOrderModal.newCustomerName')}
              value={newCustomerName}
              onChange={e => setNewCustomerName(e.target.value)}
            />
            <TextField
              size='small'
              label={t('orders.createOrderModal.newCustomerEmail')}
              type='email'
              value={newCustomerEmail}
              onChange={e => setNewCustomerEmail(e.target.value)}
            />
            <TextField
              size='small'
              label={t('orders.createOrderModal.newCustomerPhone')}
              value={newCustomerPhone}
              onChange={e => setNewCustomerPhone(e.target.value)}
            />
            <Button size='small' onClick={() => setCreateNewCustomer(false)}>
              {t('orders.createOrderModal.selectExistingCustomer')}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {t('common.actions.cancel')}
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
          {submitting ? t('common.states.saving') : t('orders.createOrderModal.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
