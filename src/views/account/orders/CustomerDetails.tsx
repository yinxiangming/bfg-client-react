'use client'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// Util Imports
import { getInitials } from '@/utils/getInitials'

interface CustomerDetailsProps {
  order: any
}

const CustomerDetails = ({ order }: CustomerDetailsProps) => {
  const t = useTranslations('account.orderDetail')
  const customer = order.customer || {}
  const user = customer.user || {}
  
  // Get user info - this is the user who created the order
  const firstName = user.first_name || ''
  const lastName = user.last_name || ''
  const customerName = 
    (firstName && lastName ? `${firstName} ${lastName}`.trim() : null) ||
    user.username ||
    customer.full_name ||
    customer.name ||
    t('customer')
  const customerEmail = user.email || customer.email || order.email || t('na')
  const customerPhone = user.phone || customer.phone || order.phone || t('na')

  return (
    <Card variant='outlined' sx={{ boxShadow: 'none', borderRadius: 2 }}>
      <CardContent sx={{ px: 3, py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'grey.300', color: 'text.secondary' }}>
            {getInitials(customerName)}
          </Avatar>
          <Typography color='text.primary' sx={{ fontWeight: 500 }}>
            {customerName}
          </Typography>
        </Box>
        <div className='flex flex-col gap-1'>
          <Typography variant='body2' color='text.secondary'>
            {t('email')}: <a href={`mailto:${customerEmail}`}>{customerEmail}</a>
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('phone')}: <a href={`tel:${customerPhone}`}>{customerPhone}</a>
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomerDetails
