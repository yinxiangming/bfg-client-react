'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'
import Support from '@/views/account/Support'

const SupportPage = () => {
  const t = useTranslations('account')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: { xs: 1, md: 0 } }}>
      <Box sx={{ pb: 1 }}>
        <Typography variant='h5' fontWeight={700}>
          {t('pages.support.title')}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {t('pages.support.subtitle')}
        </Typography>
      </Box>
      <Support />
    </Box>
  )
}

export default SupportPage
