'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'

import { getIntlLocale } from '@/utils/format'

export type OrderAttachment = {
  id: number
  media_id?: number
  url?: string | null
  kind?: string
  created_at?: string | null
}

type PaymentProofCardProps = {
  attachments?: OrderAttachment[]
}

/**
 * What the shopper uploaded against the order — a bank-transfer screenshot,
 * all but always.
 *
 * The URLs are short-lived and signed: the images live in a private bucket
 * because a payment screenshot shows someone's bank. They are good for this
 * page load, so opening one in a new tab works and bookmarking it does not.
 */
const PaymentProofCard = ({ attachments }: PaymentProofCardProps) => {
  const t = useTranslations('admin')

  const shots = (attachments || []).filter(a => a.url)
  if (shots.length === 0) return null

  const formatDateTime = (value?: string | null) => {
    if (!value) return null
    return new Date(value).toLocaleDateString(getIntlLocale(), {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader title={t('orders.paymentProof.title', { count: shots.length })} sx={{ pb: 0 }} />
      <CardContent sx={{ pt: 2 }}>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          {t('orders.paymentProof.hint')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {shots.map(shot => (
            <Box key={shot.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box
                component='a'
                href={shot.url as string}
                target='_blank'
                rel='noopener noreferrer'
                sx={{
                  display: 'block',
                  width: 160,
                  height: 160,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: theme => `1px solid ${theme.palette.divider}`,
                  '&:hover': { borderColor: 'primary.main' }
                }}
              >
                <Box
                  component='img'
                  src={shot.url as string}
                  alt={shot.kind || t('orders.paymentProof.title', { count: 1 })}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
              {shot.created_at && (
                <Typography variant='caption' color='text.secondary'>
                  {formatDateTime(shot.created_at)}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}

export default PaymentProofCard
