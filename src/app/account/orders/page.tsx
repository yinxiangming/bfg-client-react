'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

// Component Imports
import Orders from '@/views/account/Orders'
import { usePageSections } from '@/extensions/hooks/usePageSections'

const OrdersPage = () => {
  const t = useTranslations('account')
  const { beforeSections, afterSections } = usePageSections('account/orders')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: { xs: 1, md: 0 } }}>
      {beforeSections.map(
        ext =>
          ext.component && (
            <Box key={ext.id}>
              <ext.component />
            </Box>
          )
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          pb: 1
        }}
      >
        <Box>
          <Typography variant='h5' fontWeight={700}>
            {t('pages.orders.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('pages.orders.subtitle')}
          </Typography>
        </Box>
        <Button
          variant='contained'
          component={Link}
          href='/'
          sx={{ px: 3, py: 1, alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >
          {t('orders.startShopping')}
        </Button>
      </Box>

      <Orders />
      {afterSections.map(
        ext =>
          ext.component && (
            <Box key={ext.id}>
              <ext.component />
            </Box>
          )
      )}
    </Box>
  )
}

export default OrdersPage
