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
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'

import { getIntlLocale } from '@/utils/format'

type OrderDetail = {
  id: number
  status: string
  shipping_address?: {
    full_name?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    phone?: string
  }
  shipping_cost?: number | string
  shipped_at?: string | null
  delivered_at?: string | null
}

type DeliveryCardProps = {
  order: OrderDetail
}

const DeliveryCard = ({ order }: DeliveryCardProps) => {
  const t = useTranslations('admin')

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString(getIntlLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDeliveryStatus = () => {
    if (order.status === 'delivered') {
      return { label: t('orders.status.delivered'), color: 'success' as const }
    }
    if (order.status === 'shipped') {
      return { label: t('orders.status.shipped'), color: 'primary' as const }
    }
    if (order.status === 'completed') {
      return { label: t('orders.status.completed'), color: 'success' as const }
    }
    return { label: t('orders.status.pending'), color: 'warning' as const }
  }

  const deliveryStatus = getDeliveryStatus()

  return (
    <Card>
      <CardHeader title={t('orders.delivery.title')} />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: `${deliveryStatus.color}.main` }}>
              <i className='tabler-truck-delivery' />
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant='body1' sx={{ fontWeight: 500 }}>
                {t('orders.delivery.deliveryStatusLabel')}
              </Typography>
              <Chip
                label={deliveryStatus.label}
                color={deliveryStatus.color}
                variant='tonal'
                size='small'
              />
            </Box>
          </Box>
        </Box>

        {order.shipping_address && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
            <Typography variant='body2' sx={{ fontWeight: 500, mb: 1 }}>
              {t('orders.delivery.shippingAddressLabel')}:
            </Typography>
            {order.shipping_address.full_name && (
              <Typography variant='body2' color='text.secondary'>
                {order.shipping_address.full_name}
              </Typography>
            )}
            {order.shipping_address.address_line1 && (
              <Typography variant='body2' color='text.secondary'>
                {order.shipping_address.address_line1}
              </Typography>
            )}
            {order.shipping_address.address_line2 && (
              <Typography variant='body2' color='text.secondary'>
                {order.shipping_address.address_line2}
              </Typography>
            )}
            <Typography variant='body2' color='text.secondary'>
              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {order.shipping_address.country}
            </Typography>
            {order.shipping_address.phone && (
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {t('orders.delivery.phoneLabel')}: {order.shipping_address.phone}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            {t('orders.delivery.deliveryTimelineLabel')}:
          </Typography>
          
          {order.shipped_at && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <i className='tabler-package' />
                </Avatar>
                <Typography variant='body2' color='text.secondary'>
                  {t('orders.status.shipped')}
                </Typography>
              </Box>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>
                {formatDateTime(order.shipped_at)}
              </Typography>
            </Box>
          )}

          {order.delivered_at && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main' }}>
                  <i className='tabler-check' />
                </Avatar>
                <Typography variant='body2' color='text.secondary'>
                  {t('orders.status.delivered')}
                </Typography>
              </Box>
              <Typography variant='body2' sx={{ fontWeight: 500 }} color='success.main'>
                {formatDateTime(order.delivered_at)}
              </Typography>
            </Box>
          )}

          {!order.shipped_at && !order.delivered_at && (
            <Typography variant='body2' color='text.secondary'>
              {t('orders.delivery.notShippedYet')}
            </Typography>
          )}
        </Box>

        {order.shipping_cost && parseFloat(String(order.shipping_cost)) > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              {t('orders.delivery.shippingCostLabel')}:
            </Typography>
            <Typography variant='body2' sx={{ fontWeight: 500 }}>
              ${typeof order.shipping_cost === 'string' 
                ? parseFloat(order.shipping_cost).toFixed(2) 
                : order.shipping_cost.toFixed(2)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default DeliveryCard
