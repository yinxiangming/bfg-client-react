'use client'

// React Imports
import Link from 'next/link'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'

// Type Imports
import type { Customer } from '@/services/store'

type OrderDetail = {
  id: number
  order_number: string
  customer?: number | string | Customer
  customer_name?: string
  item_count?: number
}

type CustomerDetailsCardProps = {
  order: OrderDetail
}

const CustomerDetailsCard = ({ order }: CustomerDetailsCardProps) => {
  const t = useTranslations('admin')
  // Get customer info
  const customer = typeof order.customer === 'object' && order.customer !== null ? order.customer : null
  const customerId = customer ? customer.id : (typeof order.customer === 'number' ? order.customer : 0)
  const customerName = order.customer_name || 
    (customer?.user?.first_name && customer?.user?.last_name 
      ? `${customer.user.first_name} ${customer.user.last_name}`.trim()
      : customer?.user_email || customer?.user?.email || t('orders.customerCard.customerFallback', { id: customerId }))

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h5'>{t('orders.customerCard.title')}</Typography>
          {customerId > 0 && (
            <Typography
              component={Link}
              href={`/admin/store/customers/${customerId}`}
              color='primary.main'
              sx={{ fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, fontSize: '0.875rem' }}
            >
              {t('orders.customerCard.actions.viewDetails')}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 40, height: 40 }}>
            {getInitials(customerName)}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography color='text.primary' sx={{ fontWeight: 500 }}>
              {customerName}
            </Typography>
            {customer?.customer_number && (
              <Typography variant='body2' color='text.secondary'>
                {t('orders.customerCard.labels.customerNumber')}: {customer.customer_number}
              </Typography>
            )}
            <Typography variant='body2' color='text.secondary'>
              {t('orders.customerCard.labels.id')}: #{customerId}
            </Typography>
          </Box>
        </Box>
        {customer?.company_name && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'info.main' }}>
              <i className='tabler-building' />
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                {customer.company_name}
              </Typography>
              {customer.tax_number && (
                <Typography variant='body2' color='text.secondary'>
                  {t('orders.customerCard.labels.tax')}: {customer.tax_number}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'success.main' }}>
            <i className='tabler-shopping-cart' />
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography color='text.primary' sx={{ fontWeight: 500 }}>
              {t('orders.customerCard.itemsCount', { count: order.item_count || 0 })}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {t('orders.customerCard.itemsSubtitle')}
            </Typography>
          </Box>
        </Box>
        {(customer?.user?.email || customer?.user_email) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography color='text.primary' sx={{ fontWeight: 500 }}>
              {t('orders.customerCard.contact.title')}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {t('orders.customerCard.contact.email')}: {customer.user?.email || customer.user_email}
            </Typography>
            {customer.user?.phone && (
              <Typography variant='body2' color='text.secondary'>
                {t('orders.customerCard.contact.phone')}: {customer.user.phone}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default CustomerDetailsCard
