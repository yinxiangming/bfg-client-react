'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'

import { getIntlLocale } from '@/utils/format'

type Activity = {
  id: number
  title: string
  description: string
  time: string
  action: string
  color: 'primary' | 'success' | 'error' | 'warning' | 'secondary'
}

type OrderDetail = {
  id: number
  order_number: string
  status: string
  payment_status: string
  created_at: string
  paid_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  activities?: Activity[]
}

type OrderTimelineProps = {
  order: OrderDetail
}

const OrderTimeline = ({ order }: OrderTimelineProps) => {
  const t = useTranslations('admin')
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString(getIntlLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get activities from order data (from API)
  const activities = order.activities || []
  
  // Transform activities to timeline items format
  const timelineItems = activities
    .map((activity: Activity) => {
      // Map color from API to MUI Timeline color
      let timelineColor: 'primary' | 'success' | 'error' | 'warning' | 'secondary' = 'primary'
      if (activity.color === 'success') {
        timelineColor = 'success'
      } else if (activity.color === 'error') {
        timelineColor = 'error'
      } else if (activity.color === 'warning') {
        timelineColor = 'warning'
      } else if (activity.color === 'secondary') {
        timelineColor = 'secondary'
      } else {
        timelineColor = 'primary'
      }
      
      return {
        id: activity.id,
        title: activity.title,
        description: activity.description || activity.title,
        date: formatDate(activity.time),
        time: activity.time,
        color: timelineColor,
        show: true
      }
    })
    // Remove duplicates based on id (each audit log entry should be unique)
    .filter((item, index, self) => {
      return index === self.findIndex((t) => t.id === item.id)
    })
    // Sort by time in descending order (newest first)
    .sort((a, b) => {
      if (!a.time || !b.time) return 0
      return new Date(b.time).getTime() - new Date(a.time).getTime()
    })

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardHeader title={t('orders.timeline.title')} />
        <CardContent>
          <Typography variant='body2' color='text.secondary'>
            {t('orders.timeline.empty')}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title={t('orders.timeline.title')} />
      <CardContent sx={{ pt: 2 }}>
        <Timeline 
          sx={{ 
            p: 0, 
            m: 0,
            '& .MuiTimelineItem-root': { 
              minHeight: 'auto',
              '&:before': {
                display: 'none'
              }
            }
          }}
        >
          {timelineItems.map((item, index) => (
            <TimelineItem key={item.id || index}>
              <TimelineSeparator sx={{ minWidth: 20, width: 20, mr: 1 }}>
                <TimelineDot color={item.color} sx={{ width: 8, height: 8, p: 0, m: 0 }} />
                {index < timelineItems.length - 1 && <TimelineConnector sx={{ minHeight: 16, my: 0.5 }} />}
              </TimelineSeparator>
              <TimelineContent sx={{ py: 0, px: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                  <Typography color='text.primary' sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    {item.title}
                  </Typography>
                  {item.date && (
                    <Typography variant='caption' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {item.date}
                    </Typography>
                  )}
                </Box>
                {item.description && item.description !== item.title && (
                  <Typography variant='body2' sx={{ fontSize: '0.8125rem', color: 'text.secondary', mb: 0 }}>
                    {item.description}
                  </Typography>
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default OrderTimeline
