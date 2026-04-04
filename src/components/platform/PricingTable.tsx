'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import CheckIcon from '@mui/icons-material/Check'
import { getPlans } from '@/services/platform-api'

export default function PricingTable() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    async function loadPlans() {
      try {
        const data = await getPlans()
        // Adjust depending on whether it returns an array or paginated object
        const results = Array.isArray(data) ? data : (data.results || [])
        setPlans(results)
      } catch (err: any) {
        setError(err.message || 'Failed to load plans')
      } finally {
        setLoading(false)
      }
    }
    
    loadPlans()
  }, [])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  if (error) return <Typography color="error">{error}</Typography>
  if (plans.length === 0) return <Typography color="text.secondary">No plans found.</Typography>

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <FormControlLabel
          control={
            <Switch 
              checked={isAnnual} 
              onChange={(e) => setIsAnnual(e.target.checked)} 
              color="primary" 
            />
          }
          label={
            <Typography variant="body1">
              Billed Annually <Box component="span" sx={{ color: 'success.main', fontWeight: 'bold', ml: 1 }}>Save 20%</Box>
            </Typography>
          }
        />
      </Box>

      <Grid container spacing={4} justifyContent="center" alignItems="stretch">
        {plans.map((plan) => (
          <Grid item key={plan.id} xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                ...(plan.is_popular && {
                  border: 2,
                  borderColor: 'primary.main',
                  position: 'relative',
                  overflow: 'visible'
                })
              }}
            >
              {plan.is_popular && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: -12, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    typography: 'caption',
                    fontWeight: 'bold'
                  }}
                >
                  MOST POPULAR
                </Box>
              )}
              <CardHeader
                title={plan.name}
                subheader={plan.description}
                titleTypographyProps={{ align: 'center', variant: 'h5' }}
                subheaderTypographyProps={{ align: 'center' }}
                sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[700] }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 2 }}>
                  <Typography component="h2" variant="h3" color="text.primary">
                    ${isAnnual ? (plan.price_annual || plan.price * 10) : plan.price}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    /mo
                  </Typography>
                </Box>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {(plan.features || ['Core features', 'Priority support', 'Unlimited users']).map((line: string) => (
                    <Typography component="li" variant="subtitle1" align="center" key={line} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                      <CheckIcon sx={{ mr: 1, color: 'success.main', fontSize: 20 }} />
                      {line}
                    </Typography>
                  ))}
                </ul>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button fullWidth variant={plan.is_popular ? 'contained' : 'outlined'} color="primary">
                  {plan.price === 0 ? 'Sign up for free' : 'Get started'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
