'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'

// Stripe Imports
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Component Imports
import CustomTextField from '@components/ui/TextField'

// Utils Imports
import { meApi } from '@/utils/meApi'
import { useAppDialog } from '@/contexts/AppDialogContext'

interface PaymentMethod {
  id: number
  method_type?: string
  cardholder_name?: string
  card_last4?: string
  card_exp_month?: number
  card_exp_year?: number
  card_brand?: string
  display_info?: string
  is_default: boolean
  billing_address?: any
  gateway?: number
}

interface PaymentGateway {
  id: number
  name: string
  gateway_type: string
  is_active: boolean
  display_info?: {
    publishable_key?: string
    bank_name?: string
    account_name?: string
    account_number?: string
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
  const t = useTranslations('account.payments')
  const stripe = useStripe()
  const elements = useElements()
  const [cardComplete, setCardComplete] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setError(t('stripeNotInitialized'))
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError(t('cardElementNotFound'))
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
      setError(stripeError.message || t('failedCreatePaymentMethod'))
      return
    }

    if (!paymentMethod) {
      setError(t('failedCreatePaymentMethod'))
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
              {t('cardDetails')}
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
              label={t('cardholderName')}
              value={cardholderName}
              onChange={e => setCardholderName(e.target.value)}
              placeholder={t('nameOnCard')}
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
                <Typography variant='body2'>{t('setAsDefault')}</Typography>
              </label>
            </Box>
          </Grid>
          
          {/* Security Notice */}
          <Grid size={{ xs: 12 }}>
            <Alert severity='info' icon={<i className='tabler-lock' />}>
              {t('securityNotice')}
            </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>
          {t('cancel')}
        </Button>
        <Button
          type='submit'
          variant='contained'
          disabled={saving || !stripe || !cardComplete}
        >
          {saving ? t('saving') : t('addCard')}
        </Button>
      </DialogActions>
    </form>
  )
}

const PaymentMethods = () => {
  const t = useTranslations('account.payments')
  const { confirm } = useAppDialog()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [selectedGatewayId, setSelectedGatewayId] = useState<number | null>(null)

  // Form state for Stripe card form
  const [cardholderName, setCardholderName] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  // Form state for editing
  const [editFormData, setEditFormData] = useState({
    card_holder_name: '',
    expiry_month: '',
    expiry_year: '',
    is_default: false
  })

  useEffect(() => {
    fetchPaymentMethods()
    fetchPaymentGateways()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await meApi.getPaymentMethods()
      const methods = response.results || response.data || []
      setPaymentMethods(Array.isArray(methods) ? methods : [])
    } catch (err: any) {
      setError(err.message || t('failedLoad'))
      console.error('Failed to fetch payment methods:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentGateways = async () => {
    try {
      const gateways = await meApi.getPaymentGateways()
      // Only show active gateways that support card payments (e.g., Stripe)
      const activeGateways = (gateways || []).filter(
        (g: PaymentGateway) => g.is_active && g.gateway_type === 'stripe'
      )
      setPaymentGateways(activeGateways)
      
      // Initialize Stripe if Stripe gateway is available and configured
      const stripeGateway = activeGateways.find(g => g.gateway_type === 'stripe')
      if (stripeGateway?.display_info?.publishable_key) {
        try {
          const promise = loadStripe(stripeGateway.display_info.publishable_key)
          setStripePromise(promise)
          setSelectedGatewayId(stripeGateway.id)
        } catch (stripeError) {
          console.error('Failed to initialize Stripe:', stripeError)
          setError('Failed to initialize Stripe. Please check if Stripe is configured correctly.')
        }
      } else if (stripeGateway) {
        // Stripe gateway exists but not configured properly
        console.warn('Stripe gateway found but publishable_key is not configured')
      }
    } catch (err: any) {
      console.error('Failed to fetch payment gateways:', err)
    }
  }

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method)
      setEditFormData({
        card_holder_name: method.cardholder_name || '',
        expiry_month: method.card_exp_month ? String(method.card_exp_month).padStart(2, '0') : '',
        expiry_year: method.card_exp_year ? String(method.card_exp_year) : '',
        is_default: method.is_default || false
      })
    } else {
      setEditingMethod(null)
      setCardholderName('')
      setIsDefault(false)
    }
    setDialogOpen(true)
    setError(null)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingMethod(null)
    setError(null)
    setCardholderName('')
    setIsDefault(false)
    setEditFormData({
      card_holder_name: '',
      expiry_month: '',
      expiry_year: '',
      is_default: false
    })
  }

  const handleStripeSubmit = async (paymentMethodId: string) => {
    try {
      setSaving(true)
      setError(null)

      if (!selectedGatewayId) {
        throw new Error('No payment gateway selected')
      }

      // Send payment_method_id to backend
      await meApi.createPaymentMethodWithStripe({
        gateway: selectedGatewayId,
        gateway_payment_method_data: {
          payment_method_id: paymentMethodId
        },
        is_default: isDefault
      })

      setSuccess(true)
      handleCloseDialog()
      fetchPaymentMethods()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || t('failedSave'))
    } finally {
      setSaving(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMethod) return

    try {
      setSaving(true)
      setError(null)

      await meApi.updatePaymentMethod(editingMethod.id, {
        cardholder_name: editFormData.card_holder_name,
        card_exp_month: parseInt(editFormData.expiry_month),
        card_exp_year: parseInt(editFormData.expiry_year),
        is_default: editFormData.is_default
      })

      setSuccess(true)
      handleCloseDialog()
      fetchPaymentMethods()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update payment method')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!(await confirm(t('deleteConfirm'), { danger: true }))) {
      return
    }

    try {
      setLoading(true)
      await meApi.deletePaymentMethod(id)
      fetchPaymentMethods()
    } catch (err: any) {
      setError(err.message || t('failedDelete'))
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      setLoading(true)
      await meApi.updatePaymentMethod(id, { is_default: true })
      fetchPaymentMethods()
    } catch (err: any) {
      setError(err.message || t('failedSetDefault'))
    } finally {
      setLoading(false)
    }
  }

  const formatCardNumber = (cardLast4?: string) => {
    if (cardLast4) {
      return `•••• •••• •••• ${cardLast4}`
    }
    return '•••• •••• •••• ••••'
  }

  if (loading && paymentMethods.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const canAddPaymentMethod = paymentGateways.length > 0 && stripePromise

  return (
    <Grid container spacing={3}>
      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grid>
      )}

      {success && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='success' onClose={() => setSuccess(false)}>
            Payment method {editingMethod ? 'updated' : 'added'} successfully
          </Alert>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='h6'>{t('paymentMethods')}</Typography>
          <Button 
            variant='contained' 
            onClick={() => handleOpenDialog()} 
            startIcon={<i className='tabler-plus' />}
            disabled={!canAddPaymentMethod}
          >
            {t('addPaymentMethod')}
          </Button>
        </Box>
        {!canAddPaymentMethod && (
          <Alert severity='info' sx={{ mb: 2 }}>
            {paymentGateways.length === 0 
              ? t('noGateways')
              : 'Stripe payment gateway is not properly configured (missing publishable key). Please contact the administrator.'
            }
          </Alert>
        )}
      </Grid>

      {paymentMethods.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant='body1' sx={{ mb: 2 }}>
                  {t('noPaymentMethods')}
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                  {t('addPaymentMethodHint')}
                </Typography>
                <Button 
                  variant='contained' 
                  onClick={() => handleOpenDialog()}
                  disabled={!canAddPaymentMethod}
                >
                  {t('addPaymentMethod')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ) : (
        paymentMethods.map(method => (
          <Grid size={{ xs: 12, md: 6 }} key={method.id}>
            <Card
              variant='outlined'
              sx={{
                border: method.is_default ? 2 : 1,
                borderColor: method.is_default ? 'primary.main' : 'divider',
                height: '100%'
              }}
            >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant='h6'>
                          {method.card_brand ? method.card_brand.toUpperCase() : 'Card'}
                        </Typography>
                        {method.is_default && (
                          <Chip label={t('default')} size='small' color='primary' />
                        )}
                      </Box>
                      <Typography variant='body2' sx={{ mb: 1, fontFamily: 'monospace', wordBreak: 'break-word' }}>
                        {formatCardNumber(method.card_last4)}
                      </Typography>
                      {method.cardholder_name && (
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                          {method.cardholder_name}
                        </Typography>
                      )}
                      {method.card_exp_month && method.card_exp_year && (
                        <Typography variant='body2' color='text.secondary'>
                          Expires {String(method.card_exp_month).padStart(2, '0')}/{method.card_exp_year}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {!method.is_default && (
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={() => handleSetDefault(method.id)}
                      disabled={loading}
                    >
                      {t('setDefault')}
                    </Button>
                  )}
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={() => handleOpenDialog(method)}
                    disabled={loading}
                  >
                    {t('edit')}
                  </Button>
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() => handleDelete(method.id)}
                    disabled={loading}
                  >
                    <i className='tabler-trash' />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      )}

      {/* Add Dialog with Stripe Elements */}
      {!editingMethod && stripePromise && (
        <Dialog open={dialogOpen && !editingMethod} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
          <DialogTitle>{t('addPaymentMethod')}</DialogTitle>
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

      {/* Edit Dialog */}
      {editingMethod && (
        <Dialog open={dialogOpen && !!editingMethod} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
          <form onSubmit={handleEditSubmit}>
            <DialogTitle>{t('editPaymentMethod')}</DialogTitle>
            <DialogContent>
              {error && (
                <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                    Card: {editingMethod.card_brand?.toUpperCase()} •••• {editingMethod.card_last4}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <CustomTextField
                    fullWidth
                    label={t('cardholderName')}
                    value={editFormData.card_holder_name}
                    onChange={e => setEditFormData(prev => ({ ...prev, card_holder_name: e.target.value }))}
                    placeholder={t('nameOnCard')}
                  />
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <CustomTextField
                    fullWidth
                    label={t('expiryMonth')}
                    value={editFormData.expiry_month}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                      setEditFormData(prev => ({ ...prev, expiry_month: val }))
                    }}
                    placeholder='MM'
                    inputProps={{ maxLength: 2 }}
                  />
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <CustomTextField
                    fullWidth
                    label={t('expiryYear')}
                    value={editFormData.expiry_year}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setEditFormData(prev => ({ ...prev, expiry_year: val }))
                    }}
                    placeholder='YYYY'
                    inputProps={{ maxLength: 4 }}
                  />
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type='checkbox'
                      id='edit_is_default'
                      checked={editFormData.is_default}
                      onChange={e => setEditFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                      style={{ marginRight: '8px' }}
                    />
                    <label htmlFor='edit_is_default'>
                      <Typography variant='body2'>{t('setAsDefault')}</Typography>
                    </label>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} disabled={saving}>
                {t('cancel')}
              </Button>
              <Button type='submit' variant='contained' disabled={saving}>
                {saving ? t('saving') : t('update')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Grid>
  )
}

export default PaymentMethods
