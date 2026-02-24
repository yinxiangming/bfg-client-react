'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'

// Stripe Imports
import { loadStripe, Stripe } from '@stripe/stripe-js'

// Utils Imports
import { apiFetch, bfgApi } from '@/utils/api'
import { meApi } from '@/utils/meApi'
import { storefrontApi } from '@/utils/storefrontApi'

type PaymentMethod = {
  id: number
  gateway?: number
  gateway_token?: string
  gateway_payment_method_data?: {
    payment_method_id?: string
    [key: string]: any
  }
  card_brand?: string
  card_last4?: string
  card_exp_month?: number
  card_exp_year?: number
  cardholder_name?: string
  display_info?: string
  is_default?: boolean
  [key: string]: any
}

type PaymentGateway = {
  id: number
  name: string
  gateway_type: string
  is_active: boolean
  display_info?: {
    publishable_key?: string
    [key: string]: any
  }
  // Admin API shape fallback
  is_test_mode?: boolean
  config?: Record<string, any>
  test_config?: Record<string, any>
  [key: string]: any
}

export interface PayOrderDialogProps {
  open: boolean
  onClose: () => void
  order: any
  onPaymentSuccess: () => void
  /**
   * If provided, payment methods will be loaded for this customer (admin flow).
   * Otherwise, payment methods are loaded from /api/v1/me/payment-methods/ (account flow).
   */
  customerId?: number
}

async function fetchCustomerPaymentMethods(customerId: number): Promise<PaymentMethod[]> {
  const url = `${bfgApi.paymentMethods()}?customer=${customerId}`
  const response = await apiFetch<any>(url)
  const list = Array.isArray(response) ? response : response?.results || response?.data || []
  return Array.isArray(list) ? list : []
}

async function fetchStripeGateways(): Promise<PaymentGateway[]> {
  try {
    const gateways = await meApi.getPaymentGateways()
    return (gateways || []).filter((g: PaymentGateway) => g.is_active && g.gateway_type === 'stripe')
  } catch {
    const response = await apiFetch<any>(bfgApi.paymentGateways())
    const list = Array.isArray(response) ? response : response?.results || []
    return (Array.isArray(list) ? list : []).filter((g: PaymentGateway) => g.is_active && g.gateway_type === 'stripe')
  }
}

function getGatewayPublishableKey(gateway: PaymentGateway): string | undefined {
  if (gateway.display_info?.publishable_key) return gateway.display_info.publishable_key

  const activeConfig = gateway.is_test_mode ? gateway.test_config : gateway.config
  return activeConfig?.publishable_key
}

const PayOrderDialog = ({ open, onClose, order, onPaymentSuccess, customerId }: PayOrderDialogProps) => {
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([])
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null)
  const [stripe, setStripe] = useState<Stripe | null>(null)

  const orderNumber = order?.order_number || `ORD-${order?.id ?? ''}`

  // Get order total from amounts object or direct fields
  const amounts = order?.amounts || {}
  const orderTotal = amounts.total || order?.total || order?.grand_total || 0
  const currencySymbol = order?.currency?.symbol || '$'

  const defaultMethodId = useMemo(() => {
    const defaultMethod = paymentMethods.find(m => m.is_default)
    if (defaultMethod?.id) return defaultMethod.id
    return paymentMethods[0]?.id ?? null
  }, [paymentMethods])

  useEffect(() => {
    if (open) {
      setSuccessOpen(false)
      ;(async () => {
        try {
          setLoading(true)
          setError(null)

          const [methods, gateways] = await Promise.all([
            customerId ? fetchCustomerPaymentMethods(customerId) : (async () => {
              const res = await meApi.getPaymentMethods()
              const list = (res as any)?.results || (res as any)?.data || res || []
              return Array.isArray(list) ? list : []
            })(),
            fetchStripeGateways()
          ])

          setPaymentMethods(methods)
          setPaymentGateways(gateways)

          const stripeGateway = gateways.find(g => g.gateway_type === 'stripe')
          const publishableKey = stripeGateway ? getGatewayPublishableKey(stripeGateway) : undefined

          if (publishableKey) {
            const stripeInstance = await loadStripe(publishableKey)
            setStripe(stripeInstance)
          } else {
            setStripe(null)
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load payment methods')
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [open, customerId])

  useEffect(() => {
    if (open) {
      setSelectedPaymentMethodId(defaultMethodId)
    }
  }, [open, defaultMethodId])

  const handlePayment = async () => {
    if (!selectedPaymentMethodId) {
      setError('Please select a payment method')
      return
    }

    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId)
    if (!selectedMethod) {
      setError('Selected payment method not found')
      return
    }

    const gatewayId = selectedMethod.gateway ?? paymentGateways[0]?.id
    const gateway = paymentGateways.find(g => g.id === gatewayId)
    if (!gateway) {
      setError('Payment gateway not found')
      return
    }

    try {
      setProcessing(true)
      setError(null)

      const intentResponse = await storefrontApi.createPaymentIntent({
        order_id: order.id,
        gateway_id: gateway.id,
        payment_method_id: selectedMethod.id,
        ...(customerId ? { customer_id: customerId } : {})
      })

      const clientSecret = intentResponse.gateway_payload?.client_secret || intentResponse.client_secret
      if (!clientSecret) {
        throw new Error('No client secret received from server')
      }

      if (!stripe) {
        throw new Error('Stripe is not initialized')
      }

      // Align with checkout flow:
      // - For saved cards, server-side PaymentIntent includes payment_method
      // - Client confirms with client_secret only
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret)

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed')
      }

      if (paymentIntent?.status === 'succeeded') {
        setSuccessOpen(true)
        onPaymentSuccess()
      } else if (paymentIntent?.status === 'requires_action') {
        setError('Additional authentication required. Please follow the prompts.')
      } else {
        throw new Error(`Payment status: ${paymentIntent?.status}`)
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const formatCardNumber = (last4?: string) => {
    return last4 ? `•••• •••• •••• ${last4}` : '•••• •••• •••• ••••'
  }

  const getMethodLabel = (method: PaymentMethod) => {
    const brand = (method.card_brand || method.brand || 'Card').toString().toUpperCase()
    const last4 = (method.card_last4 || method.last4 || '').toString()
    const expMonth = method.card_exp_month ?? method.expiry_month
    const expYear = method.card_exp_year ?? method.expiry_year

    if (last4) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant='body1'>
              {brand} {formatCardNumber(last4)}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {expMonth && expYear ? `Expires ${String(expMonth).padStart(2, '0')}/${expYear}` : ' '}
              {method.is_default ? ' • Default' : ''}
            </Typography>
          </Box>
        </Box>
      )
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant='body1'>{method.display_info || 'Payment Method'}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {method.is_default ? 'Default' : ' '}
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Pay for Order {orderNumber}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {successOpen && (
          <Alert severity='success' sx={{ mb: 2 }}>
            Payment successful
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant='subtitle2' color='text.secondary'>
                Order Total
              </Typography>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                {currencySymbol}{Number(orderTotal).toFixed(2)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500 }}>
              Select Payment Method
            </Typography>

            {paymentMethods.length === 0 ? (
              <Alert severity='info'>
                No payment methods found.
              </Alert>
            ) : (
              <RadioGroup value={selectedPaymentMethodId || ''} onChange={(e) => setSelectedPaymentMethodId(Number(e.target.value))}>
                {paymentMethods.map((method) => (
                  <FormControlLabel
                    key={method.id}
                    value={method.id}
                    control={<Radio />}
                    label={getMethodLabel(method)}
                    sx={{
                      border: '1px solid',
                      borderColor: selectedPaymentMethodId === method.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      p: 1,
                      mb: 1,
                      mx: 0,
                      width: '100%'
                    }}
                  />
                ))}
              </RadioGroup>
            )}

            <Alert severity='info' sx={{ mt: 2 }} icon={<i className='tabler-lock' />}>
              Your payment is securely processed by Stripe.
            </Alert>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>
          {successOpen ? 'Close' : 'Cancel'}
        </Button>
        <Button
          variant='contained'
          onClick={handlePayment}
          disabled={successOpen || loading || processing || !selectedPaymentMethodId || paymentMethods.length === 0}
        >
          {successOpen ? 'Paid' : (processing ? 'Processing...' : `Pay ${currencySymbol}${Number(orderTotal).toFixed(2)}`)}
        </Button>
      </DialogActions>
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessOpen(false)} severity='success' sx={{ width: '100%' }}>
          Payment successful
        </Alert>
      </Snackbar>
    </Dialog>
  )
}

export default PayOrderDialog

