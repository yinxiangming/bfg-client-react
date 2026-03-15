'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import { BaseDataProvider } from '@/contexts/BaseDataContext'
import PackagesCard from '@/views/admin/store/orders/edit/PackagesCard'
import { getOrder, type Order } from '@/services/store'

type OrderDetail = Order & {
  packages?: any[]
  shipping_address?: any
  [key: string]: any
}

type OrderPackagesModalProps = {
  open: boolean
  onClose: () => void
  orderId: number | null
  onSuccess?: () => void
}

export default function OrderPackagesModal({ open, onClose, orderId, onSuccess }: OrderPackagesModalProps) {
  const t = useTranslations('admin')
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !orderId) {
      setOrder(null)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getOrder(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data as OrderDetail)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || t('orders.editPage.errors.fetchFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, orderId, t])

  const handleOrderUpdate = () => {
    if (orderId) {
      getOrder(orderId).then((data) => setOrder(data as OrderDetail)).catch(() => {})
    }
    onSuccess?.()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>
          {order ? t('orders.listPage.logisticsModal.title', { orderNumber: order.order_number }) : t('orders.listPage.logisticsModal.titleFallback')}
        </span>
        <IconButton size="small" onClick={onClose} aria-label="close">
          <i className="tabler-x" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!loading && order && (
          <BaseDataProvider>
            <PackagesCard order={order} onOrderUpdate={handleOrderUpdate} />
          </BaseDataProvider>
        )}
      </DialogContent>
    </Dialog>
  )
}
