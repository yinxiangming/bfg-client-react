'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { getOrder } from '@/services/store'
import { getIntlLocale } from '@/utils/format'
import type { OrderAttachment } from '@/views/admin/store/orders/edit/PaymentProofCard'

type Props = {
  open: boolean
  orderId: number | null
  onClose: () => void
}

/**
 * The screenshot itself, from the list.
 *
 * The list only knows *that* proof exists — `has_payment_proof` is one EXISTS
 * over the page, and putting signed URLs for every row in that payload would
 * mint links nobody opens. So the order is fetched when the dialog opens.
 */
const PaymentProofDialog = ({ open, orderId, onClose }: Props) => {
  const t = useTranslations('admin')
  const [shots, setShots] = useState<OrderAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !orderId) {
      setShots([])
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getOrder(orderId)
      .then(order => {
        if (cancelled) return
        setShots((((order as any).attachments || []) as OrderAttachment[]).filter(a => a.url))
      })
      .catch(err => { if (!cancelled) setError(err?.message || t('orders.editPage.errors.fetchFailed')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, orderId, t])

  const formatDateTime = (value?: string | null) => {
    if (!value) return null
    return new Date(value).toLocaleDateString(getIntlLocale(), {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{t('orders.paymentProof.title', { count: shots.length })}</span>
        <IconButton size='small' onClick={onClose} aria-label='close'>
          <i className='tabler-x' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity='error'>{error}</Alert>}
        {!loading && !error && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              {t('orders.paymentProof.hint')}
            </Typography>
            {shots.map(shot => (
              <Box key={shot.id}>
                <Box
                  component='a'
                  href={shot.url as string}
                  target='_blank'
                  rel='noopener noreferrer'
                  sx={{ display: 'block' }}
                >
                  <Box
                    component='img'
                    src={shot.url as string}
                    alt=''
                    sx={{ width: '100%', borderRadius: 1, display: 'block' }}
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
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.actions.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentProofDialog
