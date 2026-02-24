'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'

// Type Imports
import type { Order } from '@/services/store'
import { getOrderConsignments, type ConsignmentListItem } from '@/services/shipping'

type OrderPackageData = {
  id: number
  package_number: string
  length: number
  width: number
  height: number
  weight: number
  quantity: number
}

type OrderBasicInfoProps = {
  order: Order & {
    packages?: OrderPackageData[]
    payments?: Array<{ gateway_name?: string }>
    freight_service?: { name?: string; carrier_name?: string } | null
  }
  onNavigate?: (section: string) => void
}

const OrderBasicInfo = ({ order, onNavigate }: OrderBasicInfoProps) => {
  const t = useTranslations('admin')
  const [consignments, setConsignments] = useState<ConsignmentListItem[]>([])
  const [loadingConsignments, setLoadingConsignments] = useState(false)

  useEffect(() => {
    const fetchConsignments = async () => {
      if (!order.id) return
      setLoadingConsignments(true)
      try {
        const data = await getOrderConsignments(order.id)
        setConsignments(data)
      } catch (err) {
        console.error('Failed to load consignments:', err)
      } finally {
        setLoadingConsignments(false)
      }
    }
    fetchConsignments()
  }, [order.id])

  // Calculate statistics
  const packages = order.packages || []
  const packageCount = packages.length
  const totalWeight = packages.reduce((sum, pkg) => sum + (pkg.weight * pkg.quantity), 0)
  const totalVolume = packages.reduce((sum, pkg) => {
    // Volume in cm³: length * width * height * quantity
    const volume = (pkg.length * pkg.width * pkg.height * pkg.quantity) / 1000 // Convert to L
    return sum + volume
  }, 0)
  const consignmentCount = consignments.length

  // Get status color
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, 'warning' | 'info' | 'primary' | 'success' | 'error' | 'secondary' | 'default'> = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      paid: 'success',
      completed: 'success',
      cancelled: 'error',
      refunded: 'secondary'
    }
    return colorMap[status] || 'default'
  }

  // Get payment status color
  const getPaymentColor = (status: string) => {
    const colorMap: Record<string, 'warning' | 'success' | 'error' | 'secondary' | 'default'> = {
      pending: 'warning',
      paid: 'success',
      failed: 'error',
      refunded: 'secondary'
    }
    return colorMap[status] || 'default'
  }

  // Format status label
  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Order workflow steps
  const orderSteps = [
    { label: t('orders.status.pending'), value: 'pending' },
    { label: t('orders.status.paid'), value: 'paid' },
    { label: t('orders.status.processing'), value: 'processing' },
    { label: t('orders.status.shipped'), value: 'shipped' },
    { label: t('orders.status.completed'), value: 'completed' }
  ]

  const getCurrentStepIndex = () => {
    const paid = (order.payment_status || '').toLowerCase() === 'paid'
    const s = (order.status || '').toLowerCase()
    if (s === 'cancelled' || s === 'refunded') return -1
    if (!paid) return 0
    if (s === 'pending' || s === 'paid') return 1
    if (s === 'processing') return 2
    if (s === 'shipped') return 3
    if (s === 'delivered' || s === 'completed') return 4
    return 1
  }

  const currentStepIndex = getCurrentStepIndex()


  const handleStatClick = (section: string) => {
    if (onNavigate) {
      onNavigate(section)
    }
  }

  const statItemStyle = {
    cursor: onNavigate ? 'pointer' : 'default',
    '&:hover': onNavigate ? {
      backgroundColor: 'action.hover',
      borderRadius: 1,
      transition: 'background-color 0.2s'
    } : {}
  }

  return (
    <Card>
      <CardContent>
        {/* Order progress: pending -> paid -> processing -> shipped -> completed */}
        <Box sx={{ mb: 4 }}>
          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
            {t('orders.editHeader.orderProgressTitle')}
          </Typography>
          {currentStepIndex === -1 ? (
            <Chip label={t('orders.status.cancelled')} color='error' variant='filled' size='medium' />
          ) : (
            <Stepper activeStep={currentStepIndex} orientation='horizontal'>
              {orderSteps.map((step, index) => (
                <Step 
                  key={step.value} 
                  completed={index < currentStepIndex} 
                  active={index === currentStepIndex}
                >
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
        </Box>

        {/* Statistics Grid */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Box
              onClick={() => handleStatClick('packages')}
              sx={{ p: 1, ...statItemStyle }}
            >
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('orders.basicInfo.stats.packages')}
              </Typography>
              <Typography variant='h6' color='text.primary'>
                {packageCount}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Box
              onClick={() => handleStatClick('packages')}
              sx={{ p: 1, ...statItemStyle }}
            >
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('orders.basicInfo.stats.totalWeight')}
              </Typography>
              <Typography variant='h6' color='text.primary'>
                {totalWeight.toFixed(2)} kg
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Box
              onClick={() => handleStatClick('packages')}
              sx={{ p: 1, ...statItemStyle }}
            >
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('orders.basicInfo.stats.totalVolume')}
              </Typography>
              <Typography variant='h6' color='text.primary'>
                {totalVolume.toFixed(2)} L
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Box
              onClick={() => handleStatClick('consignments')}
              sx={{ p: 1, ...statItemStyle }}
            >
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('orders.basicInfo.stats.consignments')}
              </Typography>
              <Typography variant='h6' color='text.primary'>
                {loadingConsignments ? '…' : consignmentCount}
              </Typography>
            </Box>
          </Grid>

        </Grid>

        {/* Row 3: Store, Payment gateway name, Shipping method */}
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ p: 1 }}>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('orders.basicInfo.stats.store')}
              </Typography>
              <Typography variant='body1' color='text.primary'>
                {order.store_name || t('orders.basicInfo.storeFallback', { store: order.store ?? '' })}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ p: 1 }}>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('orders.basicInfo.stats.paymentGatewayType')}
              </Typography>
              <Typography variant='body1' color='text.primary'>
                {order.payments?.[0]?.gateway_name ?? '—'}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ p: 1 }}>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                {t('orders.detailsCard.shipping.methodLabel')}
              </Typography>
              <Typography variant='body1' color='text.primary'>
                {order.freight_service?.name ?? order.freight_service?.carrier_name ?? '—'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default OrderBasicInfo
