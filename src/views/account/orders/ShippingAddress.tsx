'use client'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

interface ShippingAddressProps {
  order: any
}

const ShippingAddress = ({ order }: ShippingAddressProps) => {
  const t = useTranslations('account.orderDetail')
  const address = order.shipping_address || order.addresses?.shipping || {}
  const isPickup = (order.fulfillment_method || 'shipping') === 'pickup'
  const fullName = address.full_name || t('na')
  const addressLine1 = address.address_line1 || ''
  const addressLine2 = address.address_line2 || ''
  const city = address.city || ''
  const state = address.state || ''
  const postalCode = address.postal_code || ''
  const country = address.country || ''

  const addressLines = [addressLine1, addressLine2, city, state, postalCode, country].filter(Boolean)

  return (
    <Card variant='outlined' sx={{ boxShadow: 'none', borderRadius: 2 }}>
      <CardContent sx={{ px: 3, py: 3 }}>
        <Typography variant='h6' sx={{ fontSize: '1.125rem', fontWeight: 500, mb: 2 }}>
          {isPickup ? t('pickupDetails') : t('shippingAddress')}
        </Typography>
        {isPickup ? (
          // Where to go and when — the collection equivalent of a delivery
          // address. Orders imported from before pickup points existed have
          // none, which is the only case left for the old "no address" line.
          order.pickup_point ? (
            <div className='flex flex-col gap-0.5'>
              <Typography color='text.primary' sx={{ fontWeight: 500, mb: 0.5 }}>
                {order.pickup_point.name}
              </Typography>
              {order.pickup_point.address && (
                <Typography variant='body2' color='text.secondary'>
                  {order.pickup_point.address}
                </Typography>
              )}
              {order.pickup_point.phone && (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  {t('phone')}: {order.pickup_point.phone}
                </Typography>
              )}
              {order.pickup_point.instructions && (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                  {order.pickup_point.instructions}
                </Typography>
              )}
              {order.pickup_code && (
                <Typography variant='body2' color='text.primary' sx={{ mt: 1.5, fontWeight: 500 }}>
                  {t('pickupCode')}: {order.pickup_code}
                </Typography>
              )}
            </div>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              {t('pickupNoAddress')}
            </Typography>
          )
        ) : (
        <div className='flex flex-col gap-0.5'>
          {fullName && (
            <Typography color='text.primary' sx={{ fontWeight: 500, mb: 0.5 }}>
              {fullName}
            </Typography>
          )}
          {addressLines.length > 0 ? (
            addressLines.map((line, index) => (
              <Typography key={index} variant='body2' color='text.secondary'>
                {line}
              </Typography>
            ))
          ) : (
            <Typography variant='body2' color='text.secondary'>
              {t('noShippingAddress')}
            </Typography>
          )}
          {address.phone && (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              {t('phone')}: {address.phone}
            </Typography>
          )}
          {address.email && (
            <Typography variant='body2' color='text.secondary'>
              {t('email')}: {address.email}
            </Typography>
          )}
        </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ShippingAddress
