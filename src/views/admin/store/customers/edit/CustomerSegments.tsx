'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Type Imports
import type { Customer } from '@/services/store'
import { apiFetch, bfgApi } from '@/utils/api'

type CustomerSegmentsProps = {
  customer: Customer
  onUpdate?: () => void
}

type Segment = {
  id: number
  name: string
  description?: string
}

const CustomerSegments = ({ customer }: CustomerSegmentsProps) => {
  const t = useTranslations('admin')
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [experiencePoints, setExperiencePoints] = useState<number | null>(null)

  useEffect(() => {
    fetchSegments()
    fetchExperiencePoints()
  }, [customer.id])

  const fetchSegments = async () => {
    try {
      setLoading(true)
      // Get segments from customer detail or fetch separately
      const customerDetail = await apiFetch<{ 
        segments?: Segment[]
        experience_points?: number
        experiencePoints?: number
      }>(
        `${bfgApi.customers()}${customer.id}/`
      )
      if (customerDetail.segments) {
        setSegments(customerDetail.segments)
      }
      // Try to get experience points from customer detail first
      if (customerDetail.experience_points !== undefined || customerDetail.experiencePoints !== undefined) {
        setExperiencePoints(customerDetail.experience_points ?? customerDetail.experiencePoints ?? null)
      }
    } catch (error) {
      console.error('Failed to fetch segments', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExperiencePoints = async () => {
    try {
      // First check if customer prop already has experience_points
      if ((customer as any).experience_points !== undefined) {
        setExperiencePoints((customer as any).experience_points)
        return
      }
      
      // Try to fetch from separate endpoint if not in customer detail
      const response = await apiFetch<{ points?: number; experience_points?: number; data?: number }>(
        `${bfgApi.customers()}${customer.id}/experience-points/`
      ).catch(() => null)
      
      if (response) {
        // Handle different response formats
        const points = response.points ?? response.experience_points ?? response.data ?? null
        if (points !== null && typeof points === 'number') {
          setExperiencePoints(points)
        }
      }
    } catch (error) {
      // Experience points might not be implemented yet
      console.log('Experience points not available:', error)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 4 }}>
                {t('customers.segments.title')}
              </Typography>
              {segments.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {segments.map((segment) => (
                    <Chip
                      key={segment.id}
                      label={segment.name}
                      color='primary'
                      variant='outlined'
                    />
                  ))}
                </Box>
              ) : (
                <Alert severity='info'>{t('customers.segments.empty')}</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 4 }}>
                {t('customers.segments.experiencePoints.title')}
              </Typography>
              {experiencePoints !== null ? (
                <Typography variant='h4' color='primary'>
                  {experiencePoints.toLocaleString()}
                </Typography>
              ) : (
                <Alert severity='info'>{t('customers.segments.experiencePoints.unavailable')}</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CustomerSegments
