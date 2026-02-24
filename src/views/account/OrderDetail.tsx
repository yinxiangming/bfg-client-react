'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import OrderDetailHeader from './orders/OrderDetailHeader'
import OrderDetailsCard from './orders/OrderDetailsCard'
import ShippingActivity from './orders/ShippingActivity'
import CustomerDetails from './orders/CustomerDetails'
import ShippingAddress from './orders/ShippingAddress'
import BillingAddress from './orders/BillingAddress'
import InvoicesCard from './orders/InvoicesCard'
import PaymentsCard from './orders/PaymentsCard'

// Utils Imports
import { meApi } from '@/utils/meApi'
import { useAppDialog } from '@/contexts/AppDialogContext'
import { usePageSections } from '@/extensions/hooks/usePageSections'

interface OrderDetailProps {
  orderId: number
}

const OrderDetail = ({ orderId }: OrderDetailProps) => {
  const t = useTranslations('account.orderDetail')
  const { confirm } = useAppDialog()
  const { beforeSections, afterSections } = usePageSections('account/orders/detail')

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch order details
  useEffect(() => {
    if (Number.isNaN(orderId)) {
      setError(t('notFound'))
      setLoading(false)
    } else {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await meApi.getOrder(orderId)
      setOrder(data)
    } catch (err: any) {
      setError(err.message || t('failedLoad'))
      console.error('Failed to fetch order:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!(await confirm('Are you sure you want to cancel this order?', { danger: true }))) {
      return
    }
    try {
      // TODO: Implement cancel order API call
      // await meApi.cancelOrder(orderId)
      alert('Cancel order functionality is not yet implemented')
      // fetchOrder() // Refresh order data after cancellation
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order')
    }
  }

  if (loading) {
    return (
      <Box className='flex items-center justify-center' sx={{ minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !order) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error || t('notFound')}</Alert>
        </Grid>
      </Grid>
    )
  }

  return (
    <>
      {beforeSections.map(
        ext =>
          ext.component && (
            <Box key={ext.id} sx={{ mb: 3 }}>
              <ext.component order={order} orderId={orderId} />
            </Box>
          )
      )}
      <OrderDetailHeader order={order} onCancel={handleCancelOrder} onRefresh={fetchOrder} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <OrderDetailsCard order={order} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ShippingActivity order={order} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <InvoicesCard orderId={orderId} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <PaymentsCard orderId={orderId} />
            </Grid>
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <CustomerDetails order={order} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ShippingAddress order={order} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <BillingAddress order={order} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      {afterSections.map(
        ext =>
          ext.component && (
            <Box key={ext.id} sx={{ mt: 3 }}>
              <ext.component order={order} orderId={orderId} />
            </Box>
          )
      )}
    </>
  )
}

export default OrderDetail
