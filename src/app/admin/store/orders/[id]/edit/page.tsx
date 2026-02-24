'use client'

// React Imports
import { use, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

// Component Imports
import OrderEditHeader from '@/views/admin/store/orders/edit/OrderEditHeader'
import OrderBasicInfo from '@/views/admin/store/orders/edit/OrderBasicInfo'
import OrderDetailsCard from '@/views/admin/store/orders/edit/OrderDetailsCard'
import CustomerDetailsCard from '@/views/admin/store/orders/edit/CustomerDetailsCard'
import AddressCards from '@/views/admin/store/orders/edit/AddressCards'
import PaymentCard from '@/views/admin/store/orders/edit/PaymentCard'
import DeliveryCard from '@/views/admin/store/orders/edit/DeliveryCard'
import OrderTimeline from '@/views/admin/store/orders/edit/OrderTimeline'
import InvoiceCard from '@/views/admin/store/orders/edit/InvoiceCard'
import PackagesCard from '@/views/admin/store/orders/edit/PackagesCard'
import SchemaForm from '@/components/schema/SchemaForm'

// Context Imports
import { BaseDataProvider } from '@/contexts/BaseDataContext'

// Data Imports
import { orderSchema } from '@/data/storeSchemas'

// Extension Hooks
import { usePageSections } from '@/extensions/hooks/usePageSections'
import { renderSection } from '@/extensions/hooks/renderSection'

// API Imports
import { getOrder, updateOrder, type Order } from '@/services/store'

// Extended Order type for detail view
type OrderDetail = Order & {
  subtotal?: number
  shipping_cost?: number
  tax?: number
  discount?: number
  items?: Array<{
    id: number
    product: number
    product_name: string
    variant_name?: string
    sku?: string
    quantity: number
    price: number | string
    subtotal: number | string
  }>
  shipping_address?: any
  billing_address?: any
  invoices?: any[]
  payments?: any[]
  packages?: Array<{
    id: number
    package_number: string
    template: number | null
    template_name: string | null
    length: number
    width: number
    height: number
    weight: number
    quantity: number
    volumetric_weight: number
    billing_weight: number
    total_billing_weight: number
    description: string
    notes: string
  }>
  paid_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  updated_at?: string
  customer_note?: string
  admin_note?: string
}

export default function OrderEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('admin')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { visibleSections, beforeSections, afterSections, replacements } =
    usePageSections('admin/store/orders/edit')

  const fetchOrder = useCallback(async () => {
    try {
      setFetching(true)
      setError(null)
      const data = await getOrder(parseInt(id)) as OrderDetail
      setOrder(data)
    } catch (err: any) {
      console.error('Failed to fetch order', err)
      setError(err.message || t('orders.editPage.errors.fetchFailed'))
    } finally {
      setFetching(false)
    }
  }, [id, t])

  // Debounced version of fetchOrder to avoid multiple rapid calls
  const debouncedFetchOrderRef = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        fetchOrder()
      }, 300)
    }
  }, [fetchOrder])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !order) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error || t('orders.editPage.states.notFound')}
        </Alert>
        <Button variant='outlined' onClick={() => router.push('/admin/store/orders')}>
          {t('orders.editPage.actions.backToOrders')}
        </Button>
      </Box>
    )
  }

  if (!orderSchema.form) {
    return <Alert severity='error'>{t('orders.editPage.states.schemaNotFound')}</Alert>
  }

  // Prepare form data
  const formData: Partial<Order> = {
    order_number: order.order_number,
    customer: typeof order.customer === 'object' ? (order.customer as any).id : order.customer,
    store: typeof order.store === 'object' ? (order.store as any).id : order.store,
    status: order.status,
    payment_status: order.payment_status,
    total: order.total
  }

  // Add options to select fields
  const formSchema = {
    ...orderSchema.form,
    fields: orderSchema.form.fields?.map(field => {
      if (field.field === 'status') {
        return {
          ...field,
          options: [
            { value: 'pending', label: t('orders.status.pending') },
            { value: 'paid', label: t('orders.status.paid') },
            { value: 'shipped', label: t('orders.status.shipped') },
            { value: 'completed', label: t('orders.status.completed') },
            { value: 'cancelled', label: t('orders.status.cancelled') }
          ]
        }
      }
      if (field.field === 'payment_status') {
        return {
          ...field,
          options: [
            { value: 'pending', label: t('orders.paymentStatus.pending') },
            { value: 'paid', label: t('orders.paymentStatus.paid') },
            { value: 'failed', label: t('orders.paymentStatus.failed') }
          ]
        }
      }
      if (field.field === 'store') {
        return {
          ...field,
          options: [
            { value: 1, label: t('orders.editPage.values.mainStore') },
            { value: 2, label: t('orders.editPage.values.onlineStore') }
          ]
        }
      }
      return field
    }) || []
  }

  const handleSubmit = async (data: Partial<Order>) => {
    setLoading(true)
    try {
      const updatedOrder = await updateOrder(parseInt(id), data) as OrderDetail
      setOrder(updatedOrder)
      alert(t('orders.editPage.snackbar.saved'))
    } catch (error) {
      console.error('Failed to update order', error)
      alert(t('orders.editPage.snackbar.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/store/orders/${id}`)
  }

  const handleOrderUpdate = () => {
    // Refresh order data
    fetchOrder()
  }

  const handleStatusChange = async (status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled') => {
    try {
      await updateOrder(parseInt(id), { status })
      await fetchOrder()
    } catch (error) {
      console.error('Failed to update order status', error)
      throw error
    }
  }

  const handlePaymentStatusChange = async (status: 'pending' | 'paid' | 'failed') => {
    try {
      await updateOrder(parseInt(id), { payment_status: status })
      await fetchOrder()
    } catch (error) {
      console.error('Failed to update payment status', error)
      throw error
    }
  }

  const handleNavigate = (section: string) => {
    const elementId = `section-${section}`
    const element = document.getElementById(elementId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <BaseDataProvider>
      <Box sx={{ p: 4 }}>
        <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <OrderEditHeader 
            order={order} 
            onCancel={handleCancel}
            onStatusChange={handleStatusChange}
            onPaymentStatusChange={handlePaymentStatusChange}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={6}>
            {beforeSections.map(
              ext =>
                ext.component && (
                  <Grid key={ext.id} size={{ xs: 12 }}>
                    <ext.component order={order} onOrderUpdate={fetchOrder} />
                  </Grid>
                )
            )}
            {visibleSections.includes('OrderBasicInfo') && (
              <Grid size={{ xs: 12 }}>
                {renderSection(
                  'OrderBasicInfo',
                  visibleSections,
                  replacements,
                  OrderBasicInfo,
                  { order, onNavigate: handleNavigate }
                )}
              </Grid>
            )}
            {visibleSections.includes('OrderDetails') && (
              <Grid size={{ xs: 12 }} id='section-details'>
                {renderSection(
                  'OrderDetails',
                  visibleSections,
                  replacements,
                  OrderDetailsCard,
                  { order, onOrderUpdate: () => fetchOrder() }
                )}
              </Grid>
            )}
            {visibleSections.includes('Packages') && (
              <Grid size={{ xs: 12 }} id='section-packages'>
                {renderSection(
                  'Packages',
                  visibleSections,
                  replacements,
                  PackagesCard,
                  { order, onOrderUpdate: debouncedFetchOrderRef }
                )}
              </Grid>
            )}
            {visibleSections.includes('Invoice') && (
              <Grid size={{ xs: 12 }} id='section-invoice'>
                {renderSection(
                  'Invoice',
                  visibleSections,
                  replacements,
                  InvoiceCard,
                  {
                    order: {
                      id: order.id,
                      customer: typeof order.customer === 'object' ? (order.customer as any).id : order.customer,
                      subtotal: order.subtotal,
                      tax: order.tax,
                      total: order.total,
                      items: order.items
                    },
                    onInvoiceUpdate: () => fetchOrder()
                  }
                )}
              </Grid>
            )}
            {visibleSections.includes('Payment') && (
              <Grid size={{ xs: 12 }} id='section-payment'>
                {renderSection(
                  'Payment',
                  visibleSections,
                  replacements,
                  PaymentCard,
                  { payments: order.payments || [] }
                )}
              </Grid>
            )}
            {visibleSections.includes('OrderTimeline') && (
              <Grid size={{ xs: 12 }} id='section-timeline'>
                {renderSection(
                  'OrderTimeline',
                  visibleSections,
                  replacements,
                  OrderTimeline,
                  { order }
                )}
              </Grid>
            )}
            {afterSections.map(
              ext =>
                ext.component && (
                  <Grid key={ext.id} size={{ xs: 12 }}>
                    <ext.component order={order} onOrderUpdate={fetchOrder} />
                  </Grid>
                )
            )}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={6}>
            {visibleSections.includes('CustomerDetails') && (
              <Grid size={{ xs: 12 }} id='section-customer'>
                {renderSection(
                  'CustomerDetails',
                  visibleSections,
                  replacements,
                  CustomerDetailsCard,
                  { order }
                )}
              </Grid>
            )}
            {visibleSections.includes('Addresses') && (
              <Grid size={{ xs: 12 }} id='section-address'>
                {renderSection(
                  'Addresses',
                  visibleSections,
                  replacements,
                  AddressCards,
                  {
                    orderId: order.id,
                    customerId: typeof order.customer === 'object' ? (order.customer as any).id : order.customer,
                    shippingAddress: order.shipping_address,
                    billingAddress: order.billing_address,
                    onUpdate: () => fetchOrder()
                  }
                )}
              </Grid>
            )}
            {visibleSections.includes('Delivery') && (
              <Grid size={{ xs: 12 }} id='section-delivery'>
                {renderSection(
                  'Delivery',
                  visibleSections,
                  replacements,
                  DeliveryCard,
                  { order }
                )}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
      </Box>
    </BaseDataProvider>
  )
}
