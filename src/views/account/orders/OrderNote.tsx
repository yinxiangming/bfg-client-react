'use client'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

interface OrderNoteProps {
  order: any
}

/** The note the shopper left at checkout. Renders nothing when they left none. */
const OrderNote = ({ order }: OrderNoteProps) => {
  const t = useTranslations('account.orderDetail')
  const note = (order.customer_note || '').trim()

  if (!note) return null

  return (
    <Card variant='outlined' sx={{ boxShadow: 'none', borderRadius: 2 }}>
      <CardContent sx={{ px: 3, py: 3 }}>
        <Typography variant='h6' sx={{ fontSize: '1.125rem', fontWeight: 500, mb: 2 }}>
          {t('customerNote')}
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-wrap' }}>
          {note}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default OrderNote
