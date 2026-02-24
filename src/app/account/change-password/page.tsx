'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Component Imports
import ChangePassword from '@/views/account/ChangePassword'

const ChangePasswordPage = () => {
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
            Change Password
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Keep your account secure
          </Typography>
        </Box>
      </Box>

      <ChangePassword />
    </Box>
  )
}

export default ChangePasswordPage
