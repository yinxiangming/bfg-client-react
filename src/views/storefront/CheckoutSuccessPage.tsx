'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

// Context Imports
import { useCart, type CartItem } from '@/contexts/CartContext'
import { useTheme } from '@/contexts/ThemeContext'
import { usePageSections } from '@/extensions/hooks/usePageSections'

// Import CSS
import '@/styles/storefront.css'

type OrderSummary = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  shipping: number
  total: number
}

const CheckoutSuccessPage = () => {
  const t = useTranslations('storefront')
  const router = useRouter()
  const { items, getSubtotal, getShipping, getTotalWithShipping, clearCart } = useCart()
  const theme = useTheme()
  const { beforeSections, afterSections } = usePageSections('storefront/checkout/success')
  
  // Get effective theme mode (systemMode is already the effective mode)
  const isDark = theme.systemMode === 'dark'
  const [orderSummary, setOrderSummary] = useState<OrderSummary>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: getSubtotal(),
    shipping: getShipping(),
    total: getTotalWithShipping()
  }))
  const hasCapturedSummary = useRef(false)

  useEffect(() => {
    if (hasCapturedSummary.current) return
    hasCapturedSummary.current = true

    setOrderSummary({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: getSubtotal(),
      shipping: getShipping(),
      total: getTotalWithShipping()
    })

    clearCart().catch(err => console.error('Failed to clear cart after checkout success:', err))
  }, [clearCart, getShipping, getSubtotal, getTotalWithShipping, items])

  return (
    <div className='sf-container' style={{ padding: '3rem 1rem', maxWidth: '960px', margin: '0 auto' }}>
      {beforeSections.map(
        ext =>
          ext.component && (
            <div key={ext.id} style={{ marginBottom: '1.5rem' }}>
              <ext.component orderSummary={orderSummary} />
            </div>
          )
      )}
      {/* Success Card */}
      <div className='sf-card' style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        {/* Success Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 2rem',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
          }}
        >
          <i className='tabler-check' style={{ fontSize: '3rem', color: 'white' }} />
        </div>

        {/* Success Message */}
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          marginBottom: '1rem', 
          color: isDark ? '#60a5fa' : '#2c3e50' 
        }}>
          {t('checkoutSuccess.title')}
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: isDark ? '#d1d5db' : '#757575', 
          marginBottom: '2.5rem', 
          maxWidth: '520px', 
          margin: '0 auto 2.5rem' 
        }}>
          {t('checkoutSuccess.description')}
        </p>

        {/* Order Items */}
        {orderSummary.items.length > 0 && (
          <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '2rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#2c3e50' }}>
                {t('checkoutSuccess.itemsInOrder')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orderSummary.items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: '#fafafa',
                      borderRadius: '8px',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem', color: '#2c3e50' }}>
                        {item.brand} {item.name}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#757575' }}>
                        {t('checkoutSuccess.qty')}: {item.quantity} · {t('checkoutSuccess.size')}: {item.size || '—'} · {t('checkoutSuccess.color')}: {item.color || '—'}
                      </p>
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#2c3e50', whiteSpace: 'nowrap' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            borderTop: '1px solid #e0e0e0',
            paddingTop: '2rem'
          }}
        >
          <div className='sf-success-buttons' style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <Link href='/' className='sf-btn sf-btn-primary' style={{ minWidth: '200px', textDecoration: 'none' }}>
              <i className='tabler-shopping-bag' style={{ marginRight: '0.5rem' }} />
              {t('buttons.continueShopping')}
            </Link>
            <Link
              href='/account/orders'
              className='sf-btn sf-btn-secondary'
              style={{ minWidth: '200px', textDecoration: 'none' }}
            >
              <i className='tabler-package' style={{ marginRight: '0.5rem' }} />
              {t('checkoutSuccess.viewMyOrders')}
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: isDark ? '#1f2937' : '#e3f2fd',
            border: isDark ? '1px solid #374151' : 'none',
            borderRadius: '8px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
            <i 
              className='tabler-info-circle' 
              style={{ 
                fontSize: '1.5rem', 
                color: isDark ? '#60a5fa' : '#1976d2', 
                flexShrink: 0 
              }} 
            />
            <div>
              <p style={{ 
                fontSize: '0.9375rem', 
                fontWeight: 600, 
                marginBottom: '0.5rem', 
                color: isDark ? '#60a5fa' : '#1976d2' 
              }}>
                {t('checkoutSuccess.whatNext')}
              </p>
              <ul style={{ 
                fontSize: '0.875rem', 
                color: isDark ? '#d1d5db' : '#424242', 
                margin: 0, 
                paddingLeft: '1.25rem' 
              }}>
                <li style={{ marginBottom: '0.25rem' }}>{t('checkoutSuccess.next1')}</li>
                <li style={{ marginBottom: '0.25rem' }}>{t('checkoutSuccess.next2')}</li>
                <li>{t('checkoutSuccess.next3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>


      {afterSections.map(
        ext =>
          ext.component && (
            <div key={ext.id} style={{ marginTop: '1.5rem' }}>
              <ext.component orderSummary={orderSummary} />
            </div>
          )
      )}
    </div>
  )
}

export default CheckoutSuccessPage

