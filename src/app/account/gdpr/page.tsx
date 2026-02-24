'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

import { useAppDialog } from '@/contexts/AppDialogContext'

const GdprPage = () => {
  const { confirm } = useAppDialog()

  const handleDownloadData = () => {
    // TODO: Implement GDPR data download
    alert('This feature will allow you to download all your personal data')
  }

  const handleDeleteAccount = async () => {
    if (await confirm('Are you sure you want to delete your account? This action cannot be undone.', { danger: true })) {
      // TODO: Implement account deletion
      alert('Account deletion feature coming soon')
    }
  }

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
            GDPR - Personal Data
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Access or remove your stored data
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card
            variant='outlined'
            sx={{
              borderRadius: 2,
              boxShadow: 'none',
              border: theme => `1px solid ${theme.palette.divider}`,
              backgroundColor: 'background.paper'
            }}
          >
            <CardContent>
              <Alert severity='info' className='mbe-4'>
                Under the General Data Protection Regulation (GDPR), you have the right to access,
                modify, or delete your personal data.
              </Alert>
              <div className='flex flex-col gap-4'>
                <div>
                  <Typography variant='h6' className='mbe-2'>
                    Download Your Data
                  </Typography>
                  <Typography variant='body2' color='text.secondary' className='mbe-4'>
                    Request a copy of all your personal data stored in our system.
                  </Typography>
                  <Button variant='outlined' onClick={handleDownloadData}>
                    Download My Data
                  </Button>
                </div>
                <div>
                  <Typography variant='h6' className='mbe-2'>
                    Delete Your Account
                  </Typography>
                  <Typography variant='body2' color='text.secondary' className='mbe-4'>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </Typography>
                  <Button variant='outlined' color='error' onClick={handleDeleteAccount}>
                    Delete My Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default GdprPage
