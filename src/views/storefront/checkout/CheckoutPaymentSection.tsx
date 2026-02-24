'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/contexts/ThemeContext'
import AddressAutocomplete from '@/components/storefront/AddressAutocomplete'
import type { CheckoutFormData, PaymentGateway, SavedPaymentMethod, Address } from './types'
import { hasGatewayDisplayContent } from './types'

type BillingAddressData = {
  firstName: string
  lastName: string
  address: string
  apartment: string
  city: string
  state: string
  zip: string
  country: string
}

type Props = {
  formData: CheckoutFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  isAuthenticated: boolean
  loading: boolean
  paymentGateways: PaymentGateway[]
  selectedGatewayId: number | null
  onSelectGateway: (id: number) => void
  savedPaymentMethods: SavedPaymentMethod[]
  selectedPaymentMethodId: number | null
  onSelectPaymentMethod: (id: number | null) => void
  useNewCard: boolean
  onToggleNewCard: (useNew: boolean) => void
  showOtherMethods?: boolean
  onShowOtherMethods?: (show: boolean) => void
  // Billing address props
  addresses: Address[]
  billingAddressId: number | null
  onSelectBillingAddress: (id: number | null) => void
  // New billing address form state (lifted from parent)
  newBillingAddress: BillingAddressData
  onBillingAddressChange: (data: BillingAddressData) => void
  showNewBillingAddressForm: boolean
  onShowNewBillingAddressForm: (show: boolean) => void
  // Stripe Elements callback
  onPaymentMethodReady?: (paymentMethodId: string | null) => void
}

const CheckoutPaymentSection = ({
  formData,
  onChange,
  isAuthenticated,
  loading,
  paymentGateways,
  selectedGatewayId,
  onSelectGateway,
  savedPaymentMethods,
  selectedPaymentMethodId,
  onSelectPaymentMethod,
  useNewCard,
  onToggleNewCard,
  showOtherMethods: showOtherMethodsProp,
  onShowOtherMethods: onShowOtherMethodsProp,
  addresses,
  billingAddressId,
  onSelectBillingAddress,
  newBillingAddress,
  onBillingAddressChange,
  showNewBillingAddressForm,
  onShowNewBillingAddressForm,
  onPaymentMethodReady
}: Props) => {
  const t = useTranslations('storefront')
  const theme = useTheme()
  const isDark = theme.systemMode === 'dark'
  const [internalShowOther, setInternalShowOther] = useState(false)
  const showOtherMethods = onShowOtherMethodsProp !== undefined ? (showOtherMethodsProp ?? false) : internalShowOther
  const setShowOtherMethods = onShowOtherMethodsProp ?? setInternalShowOther

  const selectedGateway = paymentGateways.find(g => g.id === selectedGatewayId)
  const requiresCreditCard = selectedGateway?.gateway_type === 'stripe'
  const showGatewayInstructions = hasGatewayDisplayContent(selectedGateway)
  
  // When user has saved cards, hide gateway selection unless they want to use other method
  const hasSavedCards = isAuthenticated && savedPaymentMethods.length > 0
  
  // Determine if we should show gateway selection
  const showGatewaySelection = !hasSavedCards || showOtherMethods

  const sectionBg = isDark ? '#1f2937' : '#f9fafb'
  const cardBg = isDark ? '#374151' : 'white'
  const borderColor = isDark ? '#4b5563' : '#d0d0d0'
  const textPrimary = isDark ? '#e5e7eb' : '#2c3e50'
  const textSecondary = isDark ? '#9ca3af' : '#757575'
  const selectedBg = isDark ? '#3730a3' : '#f0f1ff'
  const selectedBorder = '#6366f1'
  const buttonBg = isDark ? '#374151' : 'white'
  const inputBg = isDark ? '#374151' : 'white'
  const inputBorder = isDark ? '#4b5563' : '#d0d0d0'
  const inputText = isDark ? '#e5e7eb' : '#2c3e50'
  const inputPlaceholder = isDark ? '#9ca3af' : undefined

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: textPrimary }}>{t('checkout.payment.title')}</h2>
      <p style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '1rem' }}>{t('checkout.payment.secureHint')}</p>
      
      {/* Saved Cards Section - Show first when user has saved cards */}
      {hasSavedCards && !showOtherMethods && (
        <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '1.5rem', backgroundColor: sectionBg }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: textPrimary }}>{t('checkout.payment.savedCards')}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <img src='https://cdn.shopify.com/shopifycloud/checkout-web/assets/0169695890db3db16bfe.svg' alt='Visa' style={{ height: '20px' }} />
              <img src='https://cdn.shopify.com/shopifycloud/checkout-web/assets/ae9ceec48b1dc489596c.svg' alt='Mastercard' style={{ height: '20px' }} />
              <img src='https://logo.svgcdn.com/logos/amex.svg' alt='Amex' style={{ height: '20px' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {savedPaymentMethods.map(method => (
              <label
                key={method.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: selectedPaymentMethodId === method.id ? selectedBg : cardBg,
                  border: selectedPaymentMethodId === method.id ? `2px solid ${selectedBorder}` : `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type='radio'
                  name='savedCard'
                  checked={selectedPaymentMethodId === method.id}
                  onChange={() => {
                    onToggleNewCard(false)
                    onSelectPaymentMethod(method.id)
                    // Auto-select the gateway for this payment method
                    if (method.gateway) {
                      onSelectGateway(method.gateway)
                    }
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <span style={{ fontSize: '0.875rem', textTransform: 'capitalize', color: textPrimary }}>{method.card_brand}</span>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: textPrimary }}>•••• {method.card_last4}</span>
                  <span style={{ fontSize: '0.75rem', color: textSecondary }}>
                    {t('checkout.payment.expires', { month: method.card_exp_month, year: method.card_exp_year })}
                  </span>
                </div>
                {method.is_default && (
                  <span style={{ fontSize: '0.625rem', backgroundColor: '#6366f1', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                    {t('checkout.payment.default')}
                  </span>
                )}
              </label>
            ))}
          </div>
          
          {/* Option to use other payment method */}
          <button
            type='button'
            onClick={() => {
              setShowOtherMethods(true)
              onToggleNewCard(true)
              onSelectPaymentMethod(null)
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: buttonBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#6366f1',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t('checkout.payment.useDifferentMethod')}
          </button>
          
          {/* Billing Address */}
          <BillingAddressSection
            formData={formData}
            onChange={onChange}
            isAuthenticated={isAuthenticated}
            addresses={addresses}
            billingAddressId={billingAddressId}
            onSelectBillingAddress={onSelectBillingAddress}
            newBillingAddress={newBillingAddress}
            onBillingAddressChange={onBillingAddressChange}
            showNewAddressForm={showNewBillingAddressForm}
            onShowNewAddressForm={onShowNewBillingAddressForm}
          />
        </div>
      )}
      
      {/* Payment Gateway Selection - Show when no saved cards or user wants other methods */}
      {showGatewaySelection && paymentGateways.length > 0 && (
        <>
          {/* Back to saved cards button */}
          {hasSavedCards && showOtherMethods && (
            <button
              type='button'
              onClick={() => {
                setShowOtherMethods(false)
                onToggleNewCard(false)
                // Re-select default payment method
                const defaultMethod = savedPaymentMethods.find(m => m.is_default) || savedPaymentMethods[0]
                if (defaultMethod) {
                  onSelectPaymentMethod(defaultMethod.id)
                  if (defaultMethod.gateway) {
                    onSelectGateway(defaultMethod.gateway)
                  }
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0',
                marginBottom: '1rem',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '0.875rem',
                color: '#6366f1',
                cursor: 'pointer'
              }}
            >
              {t('checkout.payment.backToSavedCards')}
            </button>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
              {paymentGateways.map((gateway, index) => (
                <label
                  key={gateway.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    cursor: 'pointer',
                    backgroundColor: selectedGatewayId === gateway.id ? selectedBg : cardBg,
                    borderBottom: index < paymentGateways.length - 1 ? `1px solid ${borderColor}` : 'none',
                    borderLeft: selectedGatewayId === gateway.id ? `3px solid ${selectedBorder}` : '3px solid transparent'
                  }}
                >
                  <input
                    type='radio'
                    name='paymentGateway'
                    checked={selectedGatewayId === gateway.id}
                    onChange={() => {
                      onSelectGateway(gateway.id)
                      if (gateway.gateway_type !== 'stripe') {
                        onToggleNewCard(true)
                        onSelectPaymentMethod(null)
                      }
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary }}>
                      {gateway.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: textSecondary }}>
                      {gateway.gateway_type === 'stripe' && t('checkout.payment.gateway.creditDebitCard')}
                      {hasGatewayDisplayContent(gateway) && t('checkout.payment.gateway.paymentInstructions')}
                      {gateway.gateway_type === 'paypal' && t('checkout.payment.gateway.paypal')}
                      {gateway.gateway_type === 'wechat' && t('checkout.payment.gateway.wechat')}
                      {gateway.gateway_type === 'alipay' && t('checkout.payment.gateway.alipay')}
                    </div>
                  </div>
                  {gateway.gateway_type === 'stripe' && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <img src='https://cdn.shopify.com/shopifycloud/checkout-web/assets/0169695890db3db16bfe.svg' alt='Visa' style={{ height: '18px' }} />
                      <img src='https://cdn.shopify.com/shopifycloud/checkout-web/assets/ae9ceec48b1dc489596c.svg' alt='Mastercard' style={{ height: '18px' }} />
                      <img src='https://logo.svgcdn.com/logos/amex.svg' alt='Amex' style={{ height: '18px' }} />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Payment Details based on Gateway Type - Only show when in gateway selection mode */}
      {showGatewaySelection && selectedGateway && (
        <div style={{ border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '1.5rem', backgroundColor: sectionBg }}>
          
          {/* Gateway with display_info (instructions / details from plugin) */}
          {showGatewayInstructions && selectedGateway.display_info && (
            <GatewayDisplayInfo gatewayName={selectedGateway.name} displayInfo={selectedGateway.display_info} isDark={isDark} />
          )}
          
          {/* Credit Card Input (Stripe) - Only new card form, no saved cards here */}
          {requiresCreditCard && (
            <NewCardForm
              formData={formData}
              onChange={onChange}
              isAuthenticated={isAuthenticated}
              onPaymentMethodReady={onPaymentMethodReady}
            />
          )}
          
          {/* Other Gateway Types (redirect to external payment) */}
          {!requiresCreditCard && !showGatewayInstructions && selectedGateway && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: textPrimary }}>
                {t('checkout.payment.redirectHint', { name: selectedGateway.name })}
              </p>
            </div>
          )}
          
          {/* Billing Address */}
          <BillingAddressSection
            formData={formData}
            onChange={onChange}
            isAuthenticated={isAuthenticated}
            addresses={addresses}
            billingAddressId={billingAddressId}
            onSelectBillingAddress={onSelectBillingAddress}
            newBillingAddress={newBillingAddress}
            onBillingAddressChange={onBillingAddressChange}
            showNewAddressForm={showNewBillingAddressForm}
            onShowNewAddressForm={onShowNewBillingAddressForm}
          />
        </div>
      )}
      
      {/* No Payment Gateway Available */}
      {paymentGateways.length === 0 && !loading && (
        <div style={{ border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }}>
          <p style={{ fontSize: '0.875rem', color: isDark ? '#fca5a5' : '#991b1b' }}>
            {t('checkout.payment.noMethods')}
          </p>
        </div>
      )}
    </div>
  )
}

// Renders gateway display_info (instructions and optional bank/payment details from plugin)
const GatewayDisplayInfo = ({
  gatewayName,
  displayInfo,
  isDark = false
}: {
  gatewayName: string
  displayInfo: PaymentGateway['display_info']
  isDark?: boolean
}) => {
  const t = useTranslations('storefront')
  const hasDetails = !!(
    displayInfo?.bank_name ||
    displayInfo?.account_name ||
    displayInfo?.account_number ||
    displayInfo?.routing_number ||
    displayInfo?.swift_code
  )
  const instructions = displayInfo?.instructions ?? ''
  const boxBg = isDark ? '#374151' : 'white'
  const borderColor = isDark ? '#4b5563' : '#d0d0d0'
  const textPrimary = isDark ? '#e5e7eb' : '#2c3e50'
  const textSecondary = isDark ? '#9ca3af' : '#757575'
  const instructionsBg = isDark ? '#454545' : '#fef3c7'
  const instructionsText = isDark ? '#e5e7eb' : '#92400e'

  return (
    <div>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: textPrimary, marginBottom: '1rem' }}>
        {t('checkout.payment.gatewayDisplayInfo.title', { name: gatewayName })}
      </h3>
      <div style={{ backgroundColor: boxBg, border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '1rem' }}>
        {hasDetails && (
          <>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: textSecondary }}>{t('checkout.payment.gatewayDisplayInfo.bankName')}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary }}>
                {displayInfo!.bank_name || t('common.na')}
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: textSecondary }}>{t('checkout.payment.gatewayDisplayInfo.accountName')}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary }}>
                {displayInfo!.account_name || t('common.na')}
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: textSecondary }}>{t('checkout.payment.gatewayDisplayInfo.accountNumber')}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary, fontFamily: 'monospace' }}>
                {displayInfo!.account_number || t('common.na')}
              </div>
            </div>
            {displayInfo!.routing_number && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: textSecondary }}>{t('checkout.payment.gatewayDisplayInfo.routingNumber')}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary, fontFamily: 'monospace' }}>
                  {displayInfo!.routing_number}
                </div>
              </div>
            )}
            {displayInfo!.swift_code && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: textSecondary }}>{t('checkout.payment.gatewayDisplayInfo.swiftCode')}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: textPrimary, fontFamily: 'monospace' }}>
                  {displayInfo!.swift_code}
                </div>
              </div>
            )}
          </>
        )}
        <div
          style={{
            marginTop: hasDetails ? '1rem' : 0,
            padding: '0.75rem',
            backgroundColor: instructionsBg,
            borderRadius: '6px',
            fontSize: '0.8125rem',
            color: instructionsText,
            whiteSpace: 'pre-wrap'
          }}
        >
          {hasDetails && <strong>{t('checkout.payment.gatewayDisplayInfo.important')}</strong>}
          {hasDetails && ' '}
          {instructions || t('checkout.payment.gatewayDisplayInfo.importantFallback')}
        </div>
      </div>
    </div>
  )
}

// Stripe Elements options - light theme (default)
const CARD_ELEMENT_OPTIONS_LIGHT = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': { color: '#aab7c4' }
    },
    invalid: { color: '#fa755a', iconColor: '#fa755a' }
  }
}

// Dark theme: light text so it's visible on dark background
const CARD_ELEMENT_OPTIONS_DARK = {
  style: {
    base: {
      color: '#e0e0e0',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': { color: '#9e9e9e' }
    },
    invalid: { color: '#fca5a5', iconColor: '#fca5a5' }
  }
}

// New Card Form Sub-component - Only for entering new card details
const NewCardForm = ({
  formData,
  onChange,
  isAuthenticated,
  onPaymentMethodReady
}: {
  formData: CheckoutFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  isAuthenticated: boolean
  onPaymentMethodReady?: (paymentMethodId: string | null) => void
}) => {
  const t = useTranslations('storefront')
  const theme = useTheme()
  const stripe = useStripe()
  const elements = useElements()
  const isDark = theme.systemMode === 'dark'
  const cardElementOptions = useMemo(
    () => (isDark ? CARD_ELEMENT_OPTIONS_DARK : CARD_ELEMENT_OPTIONS_LIGHT),
    [isDark]
  )
  const [cardError, setCardError] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false
  })

  // Create payment method when card details are complete
  const createPaymentMethod = useCallback(async () => {
    if (!stripe || !elements) {
      if (onPaymentMethodReady) onPaymentMethodReady(null)
      return
    }

    const cardNumberElement = elements.getElement(CardNumberElement)
    if (!cardNumberElement) {
      if (onPaymentMethodReady) onPaymentMethodReady(null)
      return
    }

    // Only create payment method if all fields are complete
    if (!cardComplete.cardNumber || !cardComplete.cardExpiry || !cardComplete.cardCvc) {
      if (onPaymentMethodReady) onPaymentMethodReady(null)
      return
    }

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: formData.cardName || undefined
        }
      })

      if (error) {
        setCardError(error.message || t('checkout.payment.card.createFailed'))
        if (onPaymentMethodReady) onPaymentMethodReady(null)
      } else if (paymentMethod) {
        setCardError(null)
        if (onPaymentMethodReady) onPaymentMethodReady(paymentMethod.id)
      }
    } catch (err: any) {
      setCardError(err.message || t('checkout.payment.card.createFailed'))
      if (onPaymentMethodReady) onPaymentMethodReady(null)
    }
  }, [stripe, elements, cardComplete, formData.cardName, onPaymentMethodReady])

  // Update payment method when card details change
  useEffect(() => {
    if (cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc && formData.cardName) {
      createPaymentMethod()
    } else {
      if (onPaymentMethodReady) onPaymentMethodReady(null)
    }
  }, [cardComplete, formData.cardName, createPaymentMethod, onPaymentMethodReady])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50' }}>{t('checkout.payment.card.title')}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <img src='https://cdn.shopify.com/shopifycloud/checkout-web/assets/0169695890db3db16bfe.svg' alt='Visa' style={{ height: '20px' }} />
          <img src='https://cdn.shopify.com/shopifycloud/checkout-web/assets/ae9ceec48b1dc489596c.svg' alt='Mastercard' style={{ height: '20px' }} />
          <img src='https://logo.svgcdn.com/logos/amex.svg' alt='Amex' style={{ height: '20px' }} />
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', border: '1px solid #d0d0d0', borderRadius: '8px', padding: '1rem' }}>
        {cardError && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.75rem', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '6px', 
            color: '#991b1b', 
            fontSize: '0.875rem' 
          }}>
            {cardError}
          </div>
        )}
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            padding: '0.75rem',
            border: cardError ? '1px solid #fecaca' : '1px solid #d0d0d0',
            borderRadius: '6px',
            backgroundColor: 'white'
          }}>
            <CardNumberElement
              options={cardElementOptions}
              onChange={(e) => {
                setCardComplete(prev => ({ ...prev, cardNumber: e.complete }))
                if (e.error) {
                  setCardError(e.error.message)
                } else if (e.complete) {
                  setCardError(null)
                }
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{
            padding: '0.75rem',
            border: cardError ? '1px solid #fecaca' : '1px solid #d0d0d0',
            borderRadius: '6px',
            backgroundColor: 'white'
          }}>
            <CardExpiryElement
              options={cardElementOptions}
              onChange={(e) => {
                setCardComplete(prev => ({ ...prev, cardExpiry: e.complete }))
                if (e.error) {
                  setCardError(e.error.message)
                } else if (e.complete) {
                  setCardError(null)
                }
              }}
            />
          </div>
          <div style={{
            padding: '0.75rem',
            border: cardError ? '1px solid #fecaca' : '1px solid #d0d0d0',
            borderRadius: '6px',
            backgroundColor: 'white'
          }}>
            <CardCvcElement
              options={cardElementOptions}
              onChange={(e) => {
                setCardComplete(prev => ({ ...prev, cardCvc: e.complete }))
                if (e.error) {
                  setCardError(e.error.message)
                } else if (e.complete) {
                  setCardError(null)
                }
              }}
            />
          </div>
        </div>

        <div className='sf-checkout-card-name-input'>
          <input
            type='text'
            name='cardName'
            placeholder={t('checkout.payment.card.nameOnCard')}
            value={formData.cardName}
            onChange={onChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
        </div>
        
        {/* Save Card Option - Default checked for authenticated users */}
        {isAuthenticated && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#2c3e50', marginTop: '1rem' }}>
            <input
              type='checkbox'
              name='saveCard'
              checked={formData.saveCard}
              onChange={onChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            {t('checkout.payment.card.saveCard')}
          </label>
        )}
      </div>
    </div>
  )
}

// Billing Address Section Sub-component
const BillingAddressSection = ({
  formData,
  onChange,
  isAuthenticated,
  addresses,
  billingAddressId,
  onSelectBillingAddress,
  newBillingAddress,
  onBillingAddressChange,
  showNewAddressForm,
  onShowNewAddressForm
}: {
  formData: CheckoutFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  isAuthenticated: boolean
  addresses: Address[]
  billingAddressId: number | null
  onSelectBillingAddress: (id: number | null) => void
  newBillingAddress: BillingAddressData
  onBillingAddressChange: (data: BillingAddressData) => void
  showNewAddressForm: boolean
  onShowNewAddressForm: (show: boolean) => void
}) => {
  const t = useTranslations('storefront')
  const theme = useTheme()
  const isDark = theme.systemMode === 'dark'
  const availableAddresses = addresses
  const billingBorder = isDark ? '#4b5563' : '#d0d0d0'
  const billingText = isDark ? '#e5e7eb' : '#2c3e50'
  const billingBg = isDark ? '#374151' : 'white'
  const billingTextSecondary = isDark ? '#9ca3af' : '#757575'
  
  // Handle address autocomplete
  const handleBillingAddressChange = useCallback((value: string) => {
    onBillingAddressChange({ ...newBillingAddress, address: value })
  }, [newBillingAddress, onBillingAddressChange])
  
  const handleBillingAddressSelect = useCallback((components: {
    address: string
    city: string
    state: string
    zip: string
    country: string
  }) => {
    onBillingAddressChange({
      ...newBillingAddress,
      address: components.address,
      city: components.city || newBillingAddress.city,
      state: components.state || newBillingAddress.state,
      zip: components.zip || newBillingAddress.zip,
      country: components.country || newBillingAddress.country
    })
  }, [newBillingAddress, onBillingAddressChange])
  
  const inputStyle: React.CSSProperties = {
    padding: '0.75rem',
    border: `1px solid ${billingBorder}`,
    borderRadius: '6px',
    fontSize: '0.875rem',
    backgroundColor: billingBg,
    color: billingText
  }
  
  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Same as billing checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: billingText }}>
        <input
          type='checkbox'
          name='sameAsBilling'
          checked={formData.sameAsBilling}
          onChange={(e) => {
            onChange(e)
            // When switching to same as billing, clear billing address selection
            if (e.target.checked) {
              onSelectBillingAddress(null)
              onShowNewAddressForm(false)
            } else if (isAuthenticated && availableAddresses.length > 0) {
              // When unchecking, auto-select first available address
              const defaultAddr = availableAddresses.find(a => a.is_default) || availableAddresses[0]
              onSelectBillingAddress(defaultAddr?.id || null)
            }
          }}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
        {t('checkout.payment.billing.useShippingAsBilling')}
      </label>
      
      {/* Billing Address Selection - Show when not same as shipping */}
      {!formData.sameAsBilling && isAuthenticated && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: billingBg, border: `1px solid ${billingBorder}`, borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: billingText, marginBottom: '0.75rem' }}>
            {t('checkout.payment.billing.selectBillingAddress')}
          </div>
          
          {availableAddresses.length > 0 && !showNewAddressForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {availableAddresses.map(addr => (
                <label
                  key={addr.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: billingAddressId === addr.id ? (isDark ? '#3730a3' : '#e0e7ff') : (isDark ? '#4b5563' : '#f9fafb'),
                    border: billingAddressId === addr.id ? '2px solid #6366f1' : `1px solid ${billingBorder}`,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type='radio'
                    name='billingAddress'
                    checked={billingAddressId === addr.id}
                    onChange={() => onSelectBillingAddress(addr.id)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', marginTop: '2px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: billingText }}>
                      {addr.first_name} {addr.last_name}
                      {addr.is_default && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.625rem', backgroundColor: '#6366f1', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                          {t('checkout.payment.default')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: billingTextSecondary, marginTop: '0.25rem' }}>
                      {addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: billingTextSecondary }}>
                      {addr.city}, {addr.state} {addr.postal_code}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: billingTextSecondary }}>
                      {addr.country}
                    </div>
                  </div>
                </label>
              ))}
              
              {/* Add new address button */}
              <button
                type='button'
                onClick={() => {
                  onShowNewAddressForm(true)
                  onSelectBillingAddress(null)
                }}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'transparent',
                  border: `1px dashed ${billingBorder}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#6366f1',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {t('checkout.payment.billing.addNewBillingAddress')}
              </button>
            </div>
          )}
          
          {/* New address form or when no saved addresses */}
          {(showNewAddressForm || availableAddresses.length === 0) && (
            <div>
              {availableAddresses.length > 0 && (
                <button
                  type='button'
                  onClick={() => {
                    onShowNewAddressForm(false)
                    const defaultAddr = availableAddresses.find(a => a.is_default) || availableAddresses[0]
                    onSelectBillingAddress(defaultAddr?.id || null)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0',
                    marginBottom: '1rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '0.875rem',
                    color: '#6366f1',
                    cursor: 'pointer'
                  }}
                >
                  {t('checkout.payment.billing.backToSavedAddresses')}
                </button>
              )}
              
              <div style={{ fontSize: '0.75rem', color: '#757575', marginBottom: '0.75rem' }}>
                {t('checkout.payment.billing.enterNewBillingAddress')}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input
                    type='text'
                    name='billingFirstName'
                    placeholder={t('checkout.payment.billing.placeholders.firstName')}
                    value={newBillingAddress.firstName}
                    onChange={(e) => onBillingAddressChange({ ...newBillingAddress, firstName: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type='text'
                    name='billingLastName'
                    placeholder={t('checkout.payment.billing.placeholders.lastName')}
                    value={newBillingAddress.lastName}
                    onChange={(e) => onBillingAddressChange({ ...newBillingAddress, lastName: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <AddressAutocomplete
                  value={newBillingAddress.address}
                  onChange={handleBillingAddressChange}
                  onAddressSelect={handleBillingAddressSelect}
                  placeholder={t('checkout.payment.billing.placeholders.address')}
                  style={{ ...inputStyle, width: '100%' }}
                />
                <input
                  type='text'
                  name='billingApartment'
                  placeholder={t('checkout.payment.billing.placeholders.apartmentOptional')}
                  value={newBillingAddress.apartment}
                  onChange={(e) => onBillingAddressChange({ ...newBillingAddress, apartment: e.target.value })}
                  style={inputStyle}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <input
                    type='text'
                    name='billingCity'
                    placeholder={t('checkout.payment.billing.placeholders.city')}
                    value={newBillingAddress.city}
                    onChange={(e) => onBillingAddressChange({ ...newBillingAddress, city: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type='text'
                    name='billingState'
                    placeholder={t('checkout.payment.billing.placeholders.state')}
                    value={newBillingAddress.state}
                    onChange={(e) => onBillingAddressChange({ ...newBillingAddress, state: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    type='text'
                    name='billingZip'
                    placeholder={t('checkout.payment.billing.placeholders.zipCode')}
                    value={newBillingAddress.zip}
                    onChange={(e) => onBillingAddressChange({ ...newBillingAddress, zip: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Guest user - Show simple form when not same as shipping */}
      {!formData.sameAsBilling && !isAuthenticated && (
        <BillingAddressForm
          newBillingAddress={newBillingAddress}
          onBillingAddressChange={onBillingAddressChange}
          handleBillingAddressChange={handleBillingAddressChange}
          handleBillingAddressSelect={handleBillingAddressSelect}
        />
      )}
    </div>
  )
}

// Guest user billing address form with autocomplete
const BillingAddressForm = ({
  newBillingAddress,
  onBillingAddressChange,
  handleBillingAddressChange,
  handleBillingAddressSelect
}: {
  newBillingAddress: BillingAddressData
  onBillingAddressChange: (data: BillingAddressData) => void
  handleBillingAddressChange: (value: string) => void
  handleBillingAddressSelect: (components: { address: string; city: string; state: string; zip: string; country: string }) => void
}) => {
  const t = useTranslations('storefront')
  const inputStyle: React.CSSProperties = {
    padding: '0.75rem',
    border: '1px solid #d0d0d0',
    borderRadius: '6px',
    fontSize: '0.875rem'
  }
  
  return (
    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'white', border: '1px solid #d0d0d0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#2c3e50', marginBottom: '0.75rem' }}>
        {t('checkout.payment.billing.billingAddress')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <input
            type='text'
            name='billingFirstName'
            placeholder={t('checkout.payment.billing.placeholders.firstName')}
            value={newBillingAddress.firstName}
            onChange={(e) => onBillingAddressChange({ ...newBillingAddress, firstName: e.target.value })}
            style={inputStyle}
          />
          <input
            type='text'
            name='billingLastName'
            placeholder={t('checkout.payment.billing.placeholders.lastName')}
            value={newBillingAddress.lastName}
            onChange={(e) => onBillingAddressChange({ ...newBillingAddress, lastName: e.target.value })}
            style={inputStyle}
          />
        </div>
        <AddressAutocomplete
          value={newBillingAddress.address}
          onChange={handleBillingAddressChange}
          onAddressSelect={handleBillingAddressSelect}
          placeholder={t('checkout.payment.billing.placeholders.address')}
          style={{ ...inputStyle, width: '100%' }}
        />
        <input
          type='text'
          name='billingApartment'
          placeholder={t('checkout.payment.billing.placeholders.apartmentOptional')}
          value={newBillingAddress.apartment}
          onChange={(e) => onBillingAddressChange({ ...newBillingAddress, apartment: e.target.value })}
          style={inputStyle}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <input
            type='text'
            name='billingCity'
            placeholder={t('checkout.payment.billing.placeholders.city')}
            value={newBillingAddress.city}
            onChange={(e) => onBillingAddressChange({ ...newBillingAddress, city: e.target.value })}
            style={inputStyle}
          />
          <input
            type='text'
            name='billingState'
            placeholder={t('checkout.payment.billing.placeholders.state')}
            value={newBillingAddress.state}
            onChange={(e) => onBillingAddressChange({ ...newBillingAddress, state: e.target.value })}
            style={inputStyle}
          />
          <input
            type='text'
            name='billingZip'
            placeholder={t('checkout.payment.billing.placeholders.zipCode')}
            value={newBillingAddress.zip}
            onChange={(e) => onBillingAddressChange({ ...newBillingAddress, zip: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  )
}

export default CheckoutPaymentSection
