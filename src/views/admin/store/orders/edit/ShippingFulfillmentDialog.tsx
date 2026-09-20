'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomTextField from '@/components/ui/TextField'

import { createAdminMessage, sendAdminMessage } from '@/services/inbox'
import { getCustomer, updateOrder, type Customer, type Order } from '@/services/store'
import PackagesCard from '@/views/admin/store/orders/edit/PackagesCard'

type OrderDetail = Order & {
  customer?: number | string | { id: number }
  customer_name?: string
  pickup_point?: PickupPointSummary | null
  items?: Array<{
    id: number
    quantity: number
    product_name?: string
  }>
  packages?: Array<{
    id: number
    package_number: string
    template: number | null
    template_name: string | null
    length: number
    width: number
    height: number
    weight: number
    quantity: number
    volumetric_weight: number
    billing_weight: number
    total_billing_weight: number
    description: string
    notes: string
  }>
  shipping_address?: {
    id?: number
    full_name?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    phone?: string
  } | null
}

type ShippingFulfillmentDialogProps = {
  open: boolean
  order: OrderDetail
  onClose: () => void
  onCompleted: () => Promise<void>
}

type PickupPointSummary = {
  name?: string
  address?: string
  phone?: string
  instructions?: string
}

/** "Ready for pickup" is not actionable without where and when, so the message
 *  carries the point's address and its opening hours rather than leaving the
 *  customer to go looking for them. */
const buildPickupCopy = (
  language: string | undefined,
  customerName: string,
  orderNumber: string,
  point?: PickupPointSummary | null,
  pickupCode?: string
) => {
  const lang = (language || '').toLowerCase()
  const zh = lang.startsWith('zh')

  const details = [
    point?.name && (zh ? `自提点：${point.name}` : `Pickup point: ${point.name}`),
    point?.address && (zh ? `地址：${point.address}` : `Address: ${point.address}`),
    point?.phone && (zh ? `电话：${point.phone}` : `Phone: ${point.phone}`),
    point?.instructions,
    pickupCode && (zh ? `自提码：${pickupCode}` : `Pickup code: ${pickupCode}`)
  ].filter(Boolean).join('\n')

  if (zh) {
    return {
      subject: `订单 #${orderNumber} 可自提了`,
      message: [`您好 ${customerName}，您的订单 #${orderNumber} 已可自提。`, details].filter(Boolean).join('\n\n')
    }
  }

  return {
    subject: `Order #${orderNumber} is ready for pickup`,
    message: [`Hi ${customerName}, your order #${orderNumber} is ready for pickup.`, details].filter(Boolean).join('\n\n')
  }
}

const ShippingFulfillmentDialog = ({ open, order, onClose, onCompleted }: ShippingFulfillmentDialogProps) => {
  const t = useTranslations('admin')
  const customerValue = order.customer as number | string | { id: number } | undefined
  const customerId = typeof customerValue === 'object' && customerValue !== null
    ? customerValue.id
    : Number(customerValue)
  const defaultMode = order.fulfillment_method === 'pickup' ? 'pickup' : 'shipping'

  const [mode, setMode] = useState<'shipping' | 'pickup'>(defaultMode)
  const [busy, setBusy] = useState(false)
  const [loadingCustomer, setLoadingCustomer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickupSubject, setPickupSubject] = useState('')
  const [pickupMessage, setPickupMessage] = useState('')
  const [customerLanguage, setCustomerLanguage] = useState<string | undefined>()

  const customerLabel = useMemo(() => order.customer_name || 'customer', [order.customer_name])

  useEffect(() => {
    if (!open) return

    const nextMode = order.fulfillment_method === 'pickup' ? 'pickup' : 'shipping'
    setMode(nextMode)
    setError(null)

    const loadCustomerLanguage = async () => {
      if (!customerId || Number.isNaN(customerId)) {
        setCustomerLanguage(undefined)
        const copy = buildPickupCopy(undefined, customerLabel, order.order_number, order.pickup_point, order.pickup_code)
        setPickupSubject(copy.subject)
        setPickupMessage(copy.message)
        return
      }

      setLoadingCustomer(true)
      try {
        const customer = await getCustomer(customerId) as Customer
        const lang = customer.user?.language
        setCustomerLanguage(lang)
        const copy = buildPickupCopy(lang, customerLabel, order.order_number, order.pickup_point, order.pickup_code)
        setPickupSubject(copy.subject)
        setPickupMessage(copy.message)
      } catch {
        setCustomerLanguage(undefined)
        const copy = buildPickupCopy(undefined, customerLabel, order.order_number, order.pickup_point, order.pickup_code)
        setPickupSubject(copy.subject)
        setPickupMessage(copy.message)
      } finally {
        setLoadingCustomer(false)
      }
    }

    void loadCustomerLanguage()
  }, [open, customerId, order.fulfillment_method, order.order_number, customerLabel, order.pickup_point, order.pickup_code])

  const handleShipmentCreated = async () => {
    setBusy(true)
    setError(null)

    try {
      await updateOrder(order.id, { status: 'shipped' })
      await onCompleted()
      onClose()
    } catch (err: any) {
      setError(err?.message || t('orders.shippingWizard.errors.markShippedFailed'))
    } finally {
      setBusy(false)
    }
  }

  const handlePickupReady = async () => {
    if (!customerId || Number.isNaN(customerId)) {
      setError(t('orders.shippingWizard.errors.customerRequired'))
      return
    }

    setBusy(true)
    setError(null)

    try {
      const fallbackCopy = buildPickupCopy(customerLanguage, customerLabel, order.order_number, order.pickup_point, order.pickup_code)
      const message = await createAdminMessage({
        subject: pickupSubject.trim() || fallbackCopy.subject,
        message: pickupMessage.trim() || fallbackCopy.message,
        message_type: 'notification',
        action_label: customerLanguage?.toLowerCase().startsWith('zh') ? '查看订单' : 'View order',
        send_email: true
      })

      await sendAdminMessage(message.id, [customerId])
      await updateOrder(order.id, { status: 'ready_for_pickup' })
      await onCompleted()
      onClose()
    } catch (err: any) {
      setError(err?.message || t('orders.shippingWizard.errors.pickupNotifyFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth='lg' fullWidth>
      <DialogTitle>{t('orders.shippingWizard.title')}</DialogTitle>
      {/* The shipping branch renders PackagesCard, which brings its own Card
          surface; flatten it so the dialog paper is the only border. */}
      <DialogContent
        sx={{
          '&& .MuiCard-root': {
            border: 0,
            borderRadius: 0,
            boxShadow: 'none',
            backgroundColor: 'transparent'
          }
        }}
      >
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error && <Alert severity='error'>{error}</Alert>}

          <RadioGroup value={mode} onChange={(e) => setMode(e.target.value as 'shipping' | 'pickup')}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControlLabel value='shipping' control={<Radio />} label={t('orders.shippingWizard.modes.shipping')} disabled={busy} />
              <FormControlLabel value='pickup' control={<Radio />} label={t('orders.shippingWizard.modes.pickup')} disabled={busy} />
            </Stack>
          </RadioGroup>

          {mode === 'shipping' ? (
            <PackagesCard
              order={{ ...order, shipping_address: order.shipping_address ?? undefined }}
              onOrderUpdate={onCompleted}
              onShipmentCreated={handleShipmentCreated}
            />
          ) : (
            <Stack spacing={2.5}>
              <Typography variant='subtitle1'>{t('orders.shippingWizard.pickup.title')}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('orders.shippingWizard.pickup.description')}
              </Typography>

              {loadingCustomer && <Alert severity='info'>{t('orders.shippingWizard.pickup.loadingCustomerLanguage')}</Alert>}

              <CustomTextField
                label={t('orders.shippingWizard.pickup.subject')}
                value={pickupSubject}
                onChange={(e) => setPickupSubject(e.target.value)}
                disabled={busy}
                fullWidth
              />

              <CustomTextField
                label={t('orders.shippingWizard.pickup.message')}
                value={pickupMessage}
                onChange={(e) => setPickupMessage(e.target.value)}
                disabled={busy}
                multiline
                minRows={5}
                fullWidth
              />

              <Alert severity='warning'>{t('orders.shippingWizard.pickup.statusHint')}</Alert>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>{t('common.actions.close')}</Button>
        {mode === 'pickup' && (
          <Button variant='contained' onClick={handlePickupReady} disabled={busy || loadingCustomer}>
            {t('orders.shippingWizard.pickup.sendAndMarkReady')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ShippingFulfillmentDialog
