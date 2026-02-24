'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const CreditSlipsPage = () => {
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
            Credit Slips
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Review your credit slips and refunds
          </Typography>
        </Box>
      </Box>

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
          <Box className='text-center py-8'>
            <Typography variant='body1' className='mbe-4'>
              No credit slips found
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              This feature is coming soon
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default CreditSlipsPage
