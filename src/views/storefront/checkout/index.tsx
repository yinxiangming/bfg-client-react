'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { useTranslations } from 'next-intl'

import { useCart } from '@/contexts/CartContext'
import { authApi } from '@/utils/authApi'
import { meApi } from '@/utils/meApi'
import { storefrontApi } from '@/utils/storefrontApi'

import CheckoutContactSection from './CheckoutContactSection'
import CheckoutDeliverySection from './CheckoutDeliverySection'
import CheckoutShippingSection from './CheckoutShippingSection'
import CheckoutPaymentSection from './CheckoutPaymentSection'
import CheckoutOrderSummary from './CheckoutOrderSummary'
import type { CheckoutFormData, UserInfo, Address, PaymentGateway, SavedPaymentMethod } from './types'
import { isPlaceOrderGateway } from './types'
import { usePageSections } from '@/extensions/hooks/usePageSections'

import '@/styles/storefront.css'

const CheckoutPage = () => {
  const t = useTranslations('storefront')
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCart()
  const { beforeSections, afterSections } = usePageSections('storefront/checkout')
  const [submitting, setSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Payment gateway states
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([])
  const [selectedGatewayId, setSelectedGatewayId] = useState<number | null>(null)
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([])
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null)
  const [useNewCard, setUseNewCard] = useState(true)
  const [showOtherPaymentMethods, setShowOtherPaymentMethods] = useState(false)
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null)

  // Billing address state
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null)
  const [newBillingAddress, setNewBillingAddress] = useState({
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  })
  const [showNewBillingAddressForm, setShowNewBillingAddressForm] = useState(false)

  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    shippingMethod: 'standard',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardName: '',
    sameAsBilling: true,
    saveCard: true // Default to save card for authenticated users
  })

  // Price preview state
  const [pricePreview, setPricePreview] = useState<{
    subtotal: number
    discount: number
    shipping_cost: number
    tax: number
    total: number
    shipping_discount?: number | null
  } | null>(null)

  // Computed values
  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId)
  const selectedGateway = paymentGateways.find(g => g.id === selectedGatewayId)
  const requiresCreditCard = selectedGateway?.gateway_type === 'stripe'
  const placeOrderThenSuccess = isPlaceOrderGateway(selectedGateway)
  
  // Use preview prices if available, otherwise fallback to local calculation
  const subtotal = pricePreview?.subtotal ?? getSubtotal()
  const discount = pricePreview?.discount ?? 0
  // Use shipping_cost from preview if available (already includes any discounts)
  // Otherwise fallback to local calculation
  const finalShippingFee = pricePreview?.shipping_cost ?? (formData.shippingMethod === 'express' ? 20 : 10)
  const tax = pricePreview?.tax ?? (subtotal * 0.1)
  // Use total from preview if available, otherwise calculate manually
  const finalTotal = pricePreview?.total ?? (subtotal + finalShippingFee + tax - discount)

  // Fetch price preview
  useEffect(() => {
    const fetchPricePreview = async () => {
      try {
        const preview = await storefrontApi.getCartPreview(
          formData.freightServiceId ? undefined : formData.shippingMethod,
          formData.freightServiceId || undefined
        )
        setPricePreview({
          subtotal: parseFloat(preview.subtotal),
          discount: parseFloat(preview.discount),
          shipping_cost: parseFloat(preview.shipping_cost),
          tax: parseFloat(preview.tax),
          total: parseFloat(preview.total),
          shipping_discount: preview.shipping_discount ? parseFloat(preview.shipping_discount) : null
        })
      } catch (error) {
        console.error('Failed to fetch price preview:', error)
        // Fallback to local calculation
      }
    }
    
    if (items.length > 0) {
      fetchPricePreview()
    }
  }, [items, formData.shippingMethod, formData.freightServiceId])

  // Initialize checkout data
  useEffect(() => {
    const initCheckout = async () => {
      const authenticated = authApi.isAuthenticated()
      setIsAuthenticated(authenticated)
      
      // Fetch payment gateways
      let gateways: PaymentGateway[] = []
      try {
        gateways = await storefrontApi.getPaymentGateways() || []
        setPaymentGateways(gateways)
        
        // Initialize Stripe if Stripe gateway is available
        const stripeGateway = gateways.find(g => g.gateway_type === 'stripe')
        if (stripeGateway?.display_info?.publishable_key) {
          const promise = loadStripe(stripeGateway.display_info.publishable_key)
          setStripePromise(promise)
          const stripeInstance = await promise
          setStripe(stripeInstance)
        }
      } catch (error) {
        console.error('Failed to fetch payment gateways:', error)
      }
      
      if (authenticated) {
        try {
          const userInfo = await meApi.getMe()
          setUser(userInfo)
          
          const addressesData = await meApi.getAddresses()
          setAddresses(addressesData.results || [])
          
          const defaultAddr = addressesData.results?.find((addr: Address) => addr.is_default) || addressesData.results?.[0]
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
          }
          
          // Fetch saved payment methods
          try {
            const paymentMethodsData = await meApi.getPaymentMethods()
            const rawMethods = paymentMethodsData.results || paymentMethodsData || []
            const methods: SavedPaymentMethod[] = Array.isArray(rawMethods) ? rawMethods : []
            setSavedPaymentMethods(methods)
            
            if (methods.length > 0) {
              // If user has saved payment methods, auto-select the default one and its gateway
              const defaultMethod = methods.find((m: SavedPaymentMethod) => m.is_default) || methods[0]
              if (defaultMethod) {
                setSelectedPaymentMethodId(defaultMethod.id)
                setUseNewCard(false)
                // Auto-select the gateway that the saved payment method belongs to
                if (defaultMethod.gateway && gateways.some(g => g.id === defaultMethod.gateway)) {
                  setSelectedGatewayId(defaultMethod.gateway)
                } else if (gateways.length > 0) {
                  setSelectedGatewayId(gateways[0].id)
                }
              }
            } else if (gateways.length > 0) {
              // No saved payment methods, default to first gateway
              setSelectedGatewayId(gateways[0].id)
            }
          } catch (error) {
            console.warn('Failed to fetch payment methods:', error)
            // Fallback to first gateway on error
            if (gateways.length > 0) {
              setSelectedGatewayId(gateways[0].id)
            }
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error)
          // Fallback to first gateway on error
          if (gateways.length > 0) {
            setSelectedGatewayId(gateways[0].id)
          }
        }
      } else {
        // Not authenticated, default to first gateway
        if (gateways.length > 0) {
          setSelectedGatewayId(gateways[0].id)
        }
      }
      setLoading(false)
    }
    
    initCheckout()
  }, [])

  // Update form when user or selected address changes
  useEffect(() => {
    if (isAuthenticated && user) {
      const addr = selectedAddress
      // Parse full_name if first_name/last_name not available
      let firstName = addr?.first_name
      let lastName = addr?.last_name
      if (!firstName && !lastName && addr?.full_name) {
        const nameParts = addr.full_name.trim().split(' ')
        firstName = nameParts[0] || ''
        lastName = nameParts.slice(1).join(' ') || ''
      }
      
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: firstName || user.first_name || prev.firstName,
        lastName: lastName || user.last_name || prev.lastName,
        address: addr?.address_line1 || addr?.address1 || prev.address,
        apartment: addr?.address_line2 || addr?.address2 || prev.apartment,
        city: addr?.city || prev.city,
        state: addr?.state || prev.state,
        zip: addr?.postal_code || prev.zip,
        country: addr?.country || prev.country,
        phone: addr?.phone || user.phone || prev.phone,
        cardName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || prev.cardName
      }))
    }
  }, [isAuthenticated, user, selectedAddress])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => {
      const updates: any = {
        [name]: type === 'checkbox' ? checked : value
      }
      
      // Handle freightServiceId as number
      if (name === 'freightServiceId') {
        updates.freightServiceId = value ? parseInt(value, 10) : undefined
      }
      
      return {
        ...prev,
        ...updates
      }
    })
  }

  const handleAddressChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, address: value }))
  }, [])

  const handleAddressSelect = useCallback((components: {
    address: string
    city: string
    state: string
    zip: string
    country: string
  }) => {
    setFormData(prev => ({
      ...prev,
      address: components.address,
      city: components.city || prev.city,
      state: components.state || prev.state,
      zip: components.zip || prev.zip,
      country: components.country || prev.country
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Validate payment gateway
      if (!selectedGatewayId) {
        alert(t('checkout.errors.selectPaymentMethod'))
        setSubmitting(false)
        return
      }
      
      // Validate credit card fields for Stripe
      if (requiresCreditCard && useNewCard) {
        if (!paymentMethodId) {
          alert(t('checkout.errors.completeCardDetails'))
          setSubmitting(false)
          return
        }
        if (!formData.cardName?.trim()) {
          alert(t('checkout.errors.enterNameOnCard'))
          setSubmitting(false)
          return
        }
      }
      
      // Validate address fields
      if (!selectedAddressId) {
        const missingFields: string[] = []
        if (!formData.lastName?.trim()) missingFields.push(t('checkout.delivery.lastName'))
        if (!formData.address?.trim()) missingFields.push(t('checkout.delivery.address'))
        if (!formData.city?.trim()) missingFields.push(t('checkout.delivery.city'))
        if (!formData.zip?.trim()) missingFields.push(t('checkout.delivery.zipCode'))
        if (!formData.phone?.trim()) missingFields.push(t('checkout.delivery.phone'))
        
        if (missingFields.length > 0) {
          alert(t('checkout.errors.missingRequiredFields', { fields: missingFields.join(', ') }))
          setSubmitting(false)
          return
        }
      }
      
      const defaultStore = await storefrontApi.getDefaultStore()
      const storeId = defaultStore.id
      
      let orderResponse: any
      
      if (isAuthenticated) {
        let shippingAddressId = selectedAddressId
        
        if (!shippingAddressId) {
          const newAddress = await meApi.createAddress({
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            phone: formData.phone.trim(),
            email: formData.email,
            address_line1: formData.address.trim(),
            address_line2: formData.apartment,
            city: formData.city.trim(),
            state: formData.state,
            postal_code: formData.zip.trim(),
            country: formData.country,
            is_default: addresses.length === 0
          })
          shippingAddressId = newAddress.id
        }
        
        // Determine billing address
        let finalBillingAddressId: number | null = null
        
        if (formData.sameAsBilling) {
          // Use shipping address as billing address
          finalBillingAddressId = shippingAddressId
        } else if (billingAddressId) {
          // Use selected existing billing address
          finalBillingAddressId = billingAddressId
        } else if (showNewBillingAddressForm || !billingAddressId) {
          // Create new billing address
          const billingFullName = `${newBillingAddress.firstName} ${newBillingAddress.lastName}`.trim()
          if (billingFullName && newBillingAddress.address) {
            const newBillingAddr = await meApi.createAddress({
              full_name: billingFullName,
              phone: formData.phone.trim(),
              email: formData.email,
              address_line1: newBillingAddress.address.trim(),
              address_line2: newBillingAddress.apartment,
              city: newBillingAddress.city.trim(),
              state: newBillingAddress.state,
              postal_code: newBillingAddress.zip.trim(),
              country: newBillingAddress.country,
              is_default: false
            })
            finalBillingAddressId = newBillingAddr.id
          } else {
            // Fallback to shipping address if billing form is incomplete
            finalBillingAddressId = shippingAddressId
          }
        }
        
        if (!shippingAddressId || !finalBillingAddressId) {
          throw new Error('Failed to get valid address IDs')
        }
        
        orderResponse = await storefrontApi.checkout({
          store: storeId,
          shipping_address: shippingAddressId,
          billing_address: finalBillingAddressId,
          customer_note: '',
          freight_service_id: formData.freightServiceId,
          shipping_method: formData.freightServiceId ? undefined : formData.shippingMethod
        })
      } else {
        // Guest checkout - prepare billing address if different from shipping
        const guestCheckoutData: any = {
          store: storeId,
          shipping_address: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            email: formData.email,
            address_line1: formData.address,
            address_line2: formData.apartment,
            city: formData.city,
            state: formData.state,
            postal_code: formData.zip,
            country: formData.country
          },
          billing_same_as_shipping: formData.sameAsBilling,
          customer_note: '',
          email: formData.email,
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone
        }
        
        // Add billing address if different from shipping
        if (!formData.sameAsBilling && newBillingAddress.address) {
          guestCheckoutData.billing_address = {
            full_name: `${newBillingAddress.firstName} ${newBillingAddress.lastName}`.trim() || `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            email: formData.email,
            address_line1: newBillingAddress.address,
            address_line2: newBillingAddress.apartment,
            city: newBillingAddress.city,
            state: newBillingAddress.state,
            postal_code: newBillingAddress.zip,
            country: newBillingAddress.country
          }
        }
        
        if (formData.freightServiceId) {
          guestCheckoutData.freight_service_id = formData.freightServiceId
        } else {
          guestCheckoutData.shipping_method = formData.shippingMethod
        }
        
        orderResponse = await storefrontApi.guestCheckout(guestCheckoutData)
      }
      
      // Handle payment based on gateway type
      if (selectedGateway) {
        if (selectedGateway.gateway_type === 'stripe' && isAuthenticated && orderResponse?.id) {
          try {
            const paymentData: any = {
              order_id: orderResponse.id,
              gateway_id: selectedGatewayId,
              save_card: useNewCard && formData.saveCard
            }
            
            if (!useNewCard && selectedPaymentMethodId) {
              paymentData.payment_method_id = selectedPaymentMethodId
            }
            
            const paymentIntentResponse = await storefrontApi.createPaymentIntent(paymentData)
            console.log('Payment intent created:', paymentIntentResponse)
            
            // Get client_secret from gateway_payload
            const clientSecret = paymentIntentResponse.gateway_payload?.client_secret
            
            if (!clientSecret) {
              throw new Error('No client secret returned from payment intent')
            }
            
            if (!stripe) {
              throw new Error('Stripe not initialized')
            }
            
            // Confirm payment with Stripe
            let paymentResult: any
            
            if (useNewCard && paymentMethodId) {
              // Use payment method created by Stripe Elements
              paymentResult = await stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethodId
              })
              
              // Save new card if user opted in and payment succeeded
              if (formData.saveCard && paymentResult.paymentIntent?.status === 'succeeded' && selectedGatewayId) {
                try {
                  // Use the payment method ID that was already created by Stripe Elements
                  // This is the same ID used in confirmCardPayment above
                  await meApi.createPaymentMethodWithStripe({
                    gateway: selectedGatewayId,
                    gateway_payment_method_data: {
                      payment_method_id: paymentMethodId
                    },
                    is_default: savedPaymentMethods.length === 0
                  })
                } catch (cardError) {
                  console.warn('Failed to save card:', cardError)
                }
              }
            } else {
              // Use saved payment method - the payment method should already be attached to the PaymentIntent
              paymentResult = await stripe.confirmCardPayment(clientSecret)
            }
            
            if (paymentResult.error) {
              throw new Error(paymentResult.error.message || 'Payment failed')
            }
            
            if (paymentResult.paymentIntent.status === 'succeeded') {
              console.log('Payment succeeded!')
            } else if (paymentResult.paymentIntent.status === 'requires_action') {
              // Handle 3D Secure or other actions
              console.log('Payment requires additional action')
            }
          } catch (paymentError: any) {
            console.error('Payment failed:', paymentError)
            alert(paymentError.message || t('checkout.errors.paymentFailed'))
            setSubmitting(false)
            return
          }
        } else if (isPlaceOrderGateway(selectedGateway)) {
          console.log('Order created. Awaiting manual payment confirmation.')
        }
      }
      
      await clearCart()
      
      if (placeOrderThenSuccess && selectedGateway) {
        router.push(`/checkout/success?method=${selectedGateway.gateway_type}`)
      } else {
        router.push('/checkout/success')
      }
    } catch (error: any) {
      console.error('Failed to place order:', error)
      let errorMessage = t('checkout.errors.placeOrderFailed')
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.status === 401) {
        errorMessage = t('checkout.errors.loginRequired')
      } else if (error?.status === 404) {
        errorMessage = t('checkout.errors.serviceNotAvailable')
      } else if (error?.status === 500) {
        errorMessage = t('checkout.errors.serverError')
      }
      
      alert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }


  if (items.length === 0) {
    return (
      <div className='sf-container' style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#2c3e50' }}>{t('checkout.emptyCartTitle')}</h2>
        <Link href='/' className='sf-btn sf-btn-primary' style={{ textDecoration: 'none', color: 'white' }}>
          {t('buttons.continueShopping')}
        </Link>
      </div>
    )
  }

  return (
    <div className='sf-checkout-page' style={{ minHeight: '100vh' }}>
      {/* Main Content */}
      <div className='sf-container sf-checkout-container'>
        {beforeSections.map(
          ext =>
            ext.component && (
              <div key={ext.id} style={{ marginBottom: '1.5rem' }}>
                <ext.component />
              </div>
            )
        )}
        <div className='sf-checkout-layout'>
          {/* Left Column - Form */}
          <form onSubmit={handleSubmit} className='sf-checkout-form'>
            {/* Contact */}
            {!isAuthenticated && (
              <CheckoutContactSection formData={formData} onChange={handleChange} />
            )}

            {/* Delivery */}
            <CheckoutDeliverySection
              formData={formData}
              onChange={handleChange}
              onAddressChange={handleAddressChange}
              onAddressSelect={handleAddressSelect}
              isAuthenticated={isAuthenticated}
              user={user}
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onSelectAddress={setSelectedAddressId}
            />

            {/* Shipping Method */}
            <CheckoutShippingSection
              formData={formData}
              onChange={handleChange}
              country={formData.country}
              onFreightServiceChange={(serviceId) => {
                setFormData(prev => ({
                  ...prev,
                  freightServiceId: serviceId || undefined
                }))
              }}
            />

            {/* Payment */}
            {stripePromise && selectedGateway?.gateway_type === 'stripe' ? (
              <Elements stripe={stripePromise}>
                <CheckoutPaymentSection
                  formData={formData}
                  onChange={handleChange}
                  isAuthenticated={isAuthenticated}
                  loading={loading}
                  paymentGateways={paymentGateways}
                  selectedGatewayId={selectedGatewayId}
                  onSelectGateway={(id) => {
                    setSelectedGatewayId(id)
                    setPaymentMethodId(null)
                  }}
                  savedPaymentMethods={savedPaymentMethods}
                  selectedPaymentMethodId={selectedPaymentMethodId}
                  onSelectPaymentMethod={(id) => {
                    setSelectedPaymentMethodId(id)
                    if (id) setPaymentMethodId(null)
                  }}
                  useNewCard={useNewCard}
                  onToggleNewCard={(useNew) => {
                    setUseNewCard(useNew)
                    if (!useNew) setPaymentMethodId(null)
                  }}
                  showOtherMethods={showOtherPaymentMethods}
                  onShowOtherMethods={setShowOtherPaymentMethods}
                  addresses={addresses}
                  billingAddressId={billingAddressId}
                  onSelectBillingAddress={setBillingAddressId}
                  newBillingAddress={newBillingAddress}
                  onBillingAddressChange={setNewBillingAddress}
                  showNewBillingAddressForm={showNewBillingAddressForm}
                  onShowNewBillingAddressForm={setShowNewBillingAddressForm}
                  onPaymentMethodReady={setPaymentMethodId}
                />
              </Elements>
            ) : (
              <CheckoutPaymentSection
                formData={formData}
                onChange={handleChange}
                isAuthenticated={isAuthenticated}
                loading={loading}
                paymentGateways={paymentGateways}
                selectedGatewayId={selectedGatewayId}
                onSelectGateway={setSelectedGatewayId}
                savedPaymentMethods={savedPaymentMethods}
                selectedPaymentMethodId={selectedPaymentMethodId}
                onSelectPaymentMethod={setSelectedPaymentMethodId}
                useNewCard={useNewCard}
                onToggleNewCard={setUseNewCard}
                showOtherMethods={showOtherPaymentMethods}
                onShowOtherMethods={setShowOtherPaymentMethods}
                addresses={addresses}
                billingAddressId={billingAddressId}
                onSelectBillingAddress={setBillingAddressId}
                newBillingAddress={newBillingAddress}
                onBillingAddressChange={setNewBillingAddress}
                showNewBillingAddressForm={showNewBillingAddressForm}
                onShowNewBillingAddressForm={setShowNewBillingAddressForm}
              />
            )}

            {/* Submit Button */}
            <button
              type='submit'
              disabled={submitting || !selectedGatewayId}
              style={{
                width: '100%',
                padding: '1.125rem',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: (submitting || !selectedGatewayId) ? 'not-allowed' : 'pointer',
                opacity: (submitting || !selectedGatewayId) ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => !submitting && selectedGatewayId && (e.currentTarget.style.backgroundColor = '#4f46e5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6366f1')}
            >
              {submitting ? t('buttons.processing') : (
                placeOrderThenSuccess ? t('buttons.placeOrder') :
                requiresCreditCard ? t('buttons.payNow') :
                t('buttons.completeOrder')
              )}
            </button>
          </form>

          {/* Right Column - Order Summary */}
          <CheckoutOrderSummary
            items={items}
            subtotal={subtotal}
            discount={discount}
            shippingFee={finalShippingFee}
            tax={tax}
            total={finalTotal}
          />
        </div>
        {afterSections.map(
          ext =>
            ext.component && (
              <div key={ext.id} style={{ marginTop: '1.5rem' }}>
                <ext.component />
              </div>
            )
        )}
      </div>
    </div>
  )
}

export default CheckoutPage
