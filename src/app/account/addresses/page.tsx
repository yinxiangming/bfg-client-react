'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'

import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'

import Addresses from '@/views/account/Addresses'
import { usePageSections } from '@/extensions/hooks/usePageSections'

const AddressesPage = () => {
  const t = useTranslations('account.addresses')
  const openDialogRef = useRef<(() => void) | null>(null)
  const { beforeSections, afterSections } = usePageSections('account/addresses')

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
            {t('title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('subtitle')}
          </Typography>
        </Box>
        <Button
          variant='contained'
          onClick={() => openDialogRef.current?.()}
          sx={{ px: 3, py: 1, alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >
          {t('addAddress')}
        </Button>
      </Box>
      <Addresses registerOpenHandler={fn => (openDialogRef.current = fn)} />
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

export default AddressesPage
