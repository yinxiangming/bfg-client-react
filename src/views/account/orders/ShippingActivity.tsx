'use client'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

import { getIntlLocale } from '@/utils/format'

interface ShippingActivityProps {
  order: any
}

interface TimelineItem {
  title: string
  time: string
  description: string
  color: 'primary' | 'success' | 'error'
}

const ShippingActivity = ({ order }: ShippingActivityProps) => {
  const theme = useTheme()
  const t = useTranslations('account.orderDetail')
  
  // Get activities from order data (from API)
  const activities = order.activities || []
  
  // Transform activities to timeline items format
  const timelineItems: TimelineItem[] = activities.map((activity: any) => {
    const activityDate = new Date(activity.time)
    return {
      title: activity.title,
      time: activityDate.toLocaleString(getIntlLocale(), {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      description: activity.description || activity.title,
      color: activity.color || 'primary' as const
    }
  })

  if (timelineItems.length === 0) {
    return (
      <Card variant='outlined' sx={{ boxShadow: 'none', borderRadius: 2 }}>
        <CardHeader
          title={t('orderActivity')}
          sx={{
            '& .MuiCardHeader-title': {
              fontSize: '1.125rem',
              fontWeight: 500
            }
          }}
        />
        <CardContent>
          <Typography variant='body2' color='text.secondary'>
            {t('noActivity')}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const getColor = (color: 'primary' | 'success' | 'error') => {
    const palette = theme.palette
    if (color === 'success') return palette.success.main
    if (color === 'error') return palette.error.main
    return palette.primary.main
  }

  return (
    <Card variant='outlined' sx={{ boxShadow: 'none', borderRadius: 2 }}>
      <CardHeader
        title={t('orderActivity')}
        sx={{
          '& .MuiCardHeader-title': {
            fontSize: '1.125rem',
            fontWeight: 500
          }
        }}
      />
      <CardContent sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {timelineItems.map((item: TimelineItem, index: number) => {
            const isLast = index === timelineItems.length - 1
            const color = getColor(item.color)
            return (
              <Box key={index} sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 16 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: color,
                      flexShrink: 0,
                      marginTop: '6px'
                    }}
                  />
                  {!isLast && (
                    <Box
                      sx={{
                        flex: 1,
                        width: 1,
                        borderLeft: '1px solid',
                        borderColor: 'divider',
                        minHeight: 32,
                        marginTop: 0.5
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1, pb: isLast ? 0 : 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography color='text.primary' sx={{ fontWeight: 400, fontSize: '0.9375rem' }}>
                      {item.title}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.75rem', flexShrink: 0, ml: 2 }}>
                      {item.time}
                    </Typography>
                  </Box>
                  <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                    {item.description}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      </CardContent>
    </Card>
  )
}

export default ShippingActivity
