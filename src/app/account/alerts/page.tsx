'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Next Imports
import { useTranslations } from 'next-intl'

// Component Imports
import Alerts from '@/views/account/Alerts'

const AlertsPage = () => {
  const t = useTranslations('account')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: { xs: 1, md: 0 } }}>
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
            {t('pages.inbox.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('pages.inbox.subtitle')}
          </Typography>
        </Box>
      </Box>

      <Alerts />
    </Box>
  )
}

export default AlertsPage
