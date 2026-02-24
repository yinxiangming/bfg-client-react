'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Snackbar from '@mui/material/Snackbar'

// Stripe Imports
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Component Imports
import CustomTextField from '@/components/ui/TextField'

// Icon Imports
import Icon from '@/components/Icon'

// Type Imports
import { apiFetch, bfgApi } from '@/utils/api'

type CustomerPaymentMethodsProps = {
  customerId: number
  onUpdate?: () => void
}

type PaymentMethod = {
  id: number
  method_type?: string
  type?: string
  card_last4?: string
  last4?: string
  card_brand?: string
  brand?: string
  card_exp_month?: number
  expiry_month?: number
  card_exp_year?: number
  expiry_year?: number
  is_default?: boolean
}

type PaymentGateway = {
  id: number
  name: string
  gateway_type: string
  is_active: boolean
  is_test_mode?: boolean
  config?: Record<string, any>
  test_config?: Record<string, any>
  display_info?: {
    publishable_key?: string
    [key: string]: any
  }
}

// Stripe Card Element styles
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  },
  hidePostalCode: true
}

// Stripe Card Form Component (inside Elements context)
interface StripeCardFormProps {
  onSubmit: (paymentMethodId: string) => Promise<void>
  onCancel: () => void
  saving: boolean
  error: string | null
  setError: (error: string | null) => void
  cardholderName: string
  setCardholderName: (name: string) => void
  isDefault: boolean
  setIsDefault: (isDefault: boolean) => void
}

const StripeCardForm = ({
  onSubmit,
  onCancel,
  saving,
  error,
  setError,
  cardholderName,
  setCardholderName,
  isDefault,
  setIsDefault
}: StripeCardFormProps) => {
  const t = useTranslations('admin')
  const stripe = useStripe()
  const elements = useElements()
  const [cardComplete, setCardComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setError(t('customers.paymentMethods.errors.stripeNotInitialized'))
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError(t('customers.paymentMethods.errors.cardElementNotFound'))
      return
    }

    // Create PaymentMethod using Stripe Elements
    const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: cardholderName || undefined
      }
    })

    if (stripeError) {
      setError(stripeError.message || t('customers.paymentMethods.errors.createFailed'))
      return
    }

    if (!paymentMethod) {
      setError(t('customers.paymentMethods.errors.createFailed'))
      return
    }

    // Pass the payment method ID to parent
    await onSubmit(paymentMethod.id)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              {t('customers.paymentMethods.addDialog.fields.cardDetails')}
            </Typography>
            <Box
              sx={{
                border: '1px solid #ccc',
                borderRadius: 1,
                p: 2,
                '&:hover': { borderColor: '#999' },
                '&:focus-within': { borderColor: 'primary.main', borderWidth: 2 }
              }}
            >
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={(e) => setCardComplete(e.complete)}
              />
            </Box>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              fullWidth
              label={t('customers.paymentMethods.addDialog.fields.cardholderName.label')}
              value={cardholderName}
              onChange={e => setCardholderName(e.target.value)}
              placeholder={t('customers.paymentMethods.addDialog.fields.cardholderName.placeholder')}
            />
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <input
                type='checkbox'
                id='is_default'
                checked={isDefault}
                onChange={e => setIsDefault(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor='is_default'>
                <Typography variant='body2'>{t('customers.paymentMethods.addDialog.fields.setAsDefault')}</Typography>
              </label>
            </Box>
          </Grid>
          
          {/* Security Notice */}
          <Grid size={{ xs: 12 }}>
            <Alert severity='info' icon={<i className='tabler-lock' />}>
              {t('customers.paymentMethods.addDialog.securityNotice')}
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>
          {t('customers.paymentMethods.actions.cancel')}
        </Button>
        <Button
          type='submit'
          variant='contained'
          disabled={saving || !stripe || !cardComplete}
        >
          {saving ? t('common.states.saving') : t('customers.paymentMethods.actions.addCard')}
        </Button>
      </DialogActions>
    </form>
  )
}

const CustomerPaymentMethods = ({ customerId, onUpdate }: CustomerPaymentMethodsProps) => {
  const t = useTranslations('admin')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([])
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [selectedGatewayId, setSelectedGatewayId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  
  // Form state for Stripe card form
  const [cardholderName, setCardholderName] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    fetchPaymentMethods()
    fetchPaymentGateways()
  }, [customerId])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      setError(null)
      // Fetch payment methods for specific customer using query parameter
      const url = `${bfgApi.paymentMethods()}?customer=${customerId}`
      const response = await apiFetch<PaymentMethod[] | { results?: PaymentMethod[]; data?: PaymentMethod[] }>(url)
      
      // Handle different response formats
      let methods: PaymentMethod[] = []
      if (Array.isArray(response)) {
        methods = response
      } else if (response.results) {
        methods = response.results
      } else if (response.data) {
        methods = response.data
      }
      
      // Normalize field names for compatibility
      const normalizedMethods = methods.map(method => ({
        ...method,
        type: method.method_type || method.type,
        last4: method.card_last4 || method.last4,
        brand: method.card_brand || method.brand,
        expiry_month: method.card_exp_month || method.expiry_month,
        expiry_year: method.card_exp_year || method.expiry_year
      }))
      
      setPaymentMethods(normalizedMethods)
    } catch (err: any) {
      console.error('Failed to fetch payment methods', err)
      setError(err.message || t('customers.paymentMethods.errors.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentGateways = async () => {
    try {
      const response = await apiFetch<PaymentGateway[] | { results?: PaymentGateway[] }>(bfgApi.paymentGateways())
      const gateways = Array.isArray(response) ? response : (response.results || [])
      
      // Only show active gateways that support card payments (e.g., Stripe)
      const activeGateways = gateways.filter(
        (g: PaymentGateway) => g.is_active && g.gateway_type === 'stripe'
      )
      setPaymentGateways(activeGateways)
      
      // Initialize Stripe if Stripe gateway is available and configured
      const stripeGateway = activeGateways.find(g => g.gateway_type === 'stripe')
      if (stripeGateway) {
        // Get publishable_key from config or test_config based on is_test_mode
        // Admin API returns config and test_config, not display_info
        const activeConfig = stripeGateway.is_test_mode ? stripeGateway.test_config : stripeGateway.config
        const publishableKey = activeConfig?.publishable_key || stripeGateway.display_info?.publishable_key
        
        if (publishableKey) {
          try {
            const promise = loadStripe(publishableKey)
            setStripePromise(promise)
            setSelectedGatewayId(stripeGateway.id)
          } catch (stripeError) {
            console.error('Failed to initialize Stripe:', stripeError)
            setError(t('customers.paymentMethods.errors.initStripeFailed'))
          }
        } else {
          console.warn('Stripe gateway found but publishable_key is not configured', {
            is_test_mode: stripeGateway.is_test_mode,
            config: stripeGateway.config,
            test_config: stripeGateway.test_config
          })
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch payment gateways:', err)
    }
  }

  const handleOpenDialog = () => {
    setCardholderName('')
    setIsDefault(false)
    setDialogOpen(true)
    setError(null)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setError(null)
    setCardholderName('')
    setIsDefault(false)
  }

  const handleStripeSubmit = async (paymentMethodId: string) => {
    try {
      setSaving(true)
      setError(null)

      if (!selectedGatewayId) {
        throw new Error(t('customers.paymentMethods.errors.noGatewaySelected'))
      }

      // Create payment method for the specified customer
      await apiFetch(bfgApi.paymentMethods(), {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          gateway: selectedGatewayId,
          gateway_payment_method_data: {
            payment_method_id: paymentMethodId
          },
          is_default: isDefault
        })
      })

      setSuccess(true)
      handleCloseDialog()
      await fetchPaymentMethods()
      if (onUpdate) {
        onUpdate()
      }
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || t('customers.paymentMethods.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (methodId: number) => {
    setPendingDeleteId(methodId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return
    setDeleteDialogOpen(false)
    try {
      // Delete payment method using finance API
      await apiFetch(`${bfgApi.paymentMethods()}${pendingDeleteId}/`, {
        method: 'DELETE'
      })
      await fetchPaymentMethods()
      if (onUpdate) {
        onUpdate()
      }
      setSnackbar({ open: true, message: t('customers.paymentMethods.snackbar.deleted'), severity: 'success' })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t('customers.paymentMethods.snackbar.deleteFailed', { error: error.message }),
        severity: 'error'
      })
    } finally {
      setPendingDeleteId(null)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  const canAddPaymentMethod = paymentGateways.length > 0 && stripePromise

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h6'>
            {t('customers.paymentMethods.title', { count: paymentMethods.length })}
          </Typography>
          <Button
            variant='contained'
            startIcon={<Icon icon='tabler:plus' />}
            onClick={handleOpenDialog}
            disabled={!canAddPaymentMethod}
          >
            {t('customers.paymentMethods.actions.addPaymentMethod')}
          </Button>
        </Box>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            {t('customers.paymentMethods.snackbar.added')}
          </Alert>
        )}

        {!canAddPaymentMethod && (
          <Alert severity='info' sx={{ mb: 2 }}>
            {paymentGateways.length === 0 
              ? t('customers.paymentMethods.states.noGateways')
              : t('customers.paymentMethods.states.stripeMissingKey')
            }
          </Alert>
        )}

        {paymentMethods.length > 0 ? (
          <Grid container spacing={3}>
            {paymentMethods.map((method) => (
              <Grid size={{ xs: 12, sm: 6, md: 6 }} key={method.id}>
                <Card
                  variant='outlined'
                  sx={{
                    border: method.is_default ? 2 : 1,
                    borderColor: method.is_default ? 'primary.main' : 'divider',
                    height: '100%',
                    position: 'relative',
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 2,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant='h6' sx={{ textTransform: 'capitalize' }}>
                            {method.brand || method.type || t('customers.paymentMethods.values.card')}
                          </Typography>
                          {method.is_default && (
                            <Chip label={t('customers.paymentMethods.values.default')} size='small' color='primary' />
                          )}
                        </Box>
                        <Typography variant='body1' sx={{ mb: 1, fontFamily: 'monospace', fontWeight: 600, fontSize: '1.1rem' }}>
                          •••• {method.last4 || '****'}
                        </Typography>
                        {method.expiry_month && method.expiry_year && (
                          <Typography variant='body2' color='text.secondary'>
                            {t('customers.paymentMethods.values.expires', {
                              month: String(method.expiry_month).padStart(2, '0'),
                              year: method.expiry_year
                            })}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        size='small'
                        onClick={() => handleDelete(method.id)}
                        color='error'
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      >
                        <Icon icon='tabler:trash' />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity='info'>
            {t('customers.paymentMethods.empty')}
          </Alert>
        )}

        {/* Add Dialog with Stripe Elements */}
        {stripePromise && (
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
            <DialogTitle>{t('customers.paymentMethods.addDialog.title')}</DialogTitle>
            <Elements stripe={stripePromise}>
              <StripeCardForm
                onSubmit={handleStripeSubmit}
                onCancel={handleCloseDialog}
                saving={saving}
                error={error}
                setError={setError}
                cardholderName={cardholderName}
                setCardholderName={setCardholderName}
                isDefault={isDefault}
                setIsDefault={setIsDefault}
              />
            </Elements>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>{t('customers.paymentMethods.deleteDialog.title')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t('customers.paymentMethods.deleteDialog.message')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>{t('customers.paymentMethods.actions.cancel')}</Button>
            <Button onClick={handleDeleteConfirm} color='error' variant='contained'>
              {t('customers.paymentMethods.actions.delete')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  )
}

export default CustomerPaymentMethods
