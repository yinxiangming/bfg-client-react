'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { CartItem } from './types'

type Props = {
  items: CartItem[]
  subtotal: number
  discount?: number
  shippingFee: number
  tax: number
  total: number
}

const CheckoutOrderSummary = ({ items, subtotal, discount = 0, shippingFee, tax, total }: Props) => {
  const t = useTranslations('storefront')

  return (
    <div style={{ position: 'sticky', top: '2rem' }}>
      <div style={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#2c3e50' }}>
          {t('checkout.orderSummary.title')}
        </h2>
        
        {/* Cart Items */}
        <div style={{ marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <div>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h6 style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', color: '#2c3e50' }}>
                  {item.name} <span style={{ color: '#757575', fontWeight: 400 }}>x {item.quantity}</span>
                </h6>
                <p style={{ fontSize: '0.75rem', color: '#757575', marginBottom: '0.25rem' }}>
                  {item.size ? `${t('checkout.orderSummary.labels.size')}: ${item.size}` : ''}
                  {item.size && item.color ? ` | ` : ''}
                  {item.color ? `${t('checkout.orderSummary.labels.color')}: ${item.color}` : ''}
                </p>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50' }}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href='/'
            style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              textAlign: 'center',
              backgroundColor: 'transparent',
              border: '1px solid #d0d0d0',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#6366f1',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f1ff'
              e.currentTarget.style.borderColor = '#6366f1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = '#d0d0d0'
            }}
          >
            {t('checkout.orderSummary.continueShopping')}
          </Link>
        </div>

        {/* Price Summary */}
        <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#757575' }}>{t('checkout.orderSummary.labels.subtotal')}</span>
            <span style={{ fontWeight: 500, color: '#2c3e50' }}>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              <span style={{ color: '#757575' }}>{t('checkout.orderSummary.labels.discount')}</span>
              <span style={{ fontWeight: 500, color: '#10b981' }}>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#757575' }}>{t('checkout.orderSummary.labels.shipping')}</span>
            <span style={{ fontWeight: 500, color: '#2c3e50' }}>${shippingFee.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.875rem', paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
            <span style={{ color: '#757575' }}>{t('checkout.orderSummary.labels.tax')}</span>
            <span style={{ fontWeight: 500, color: '#2c3e50' }}>${tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#2c3e50' }}>{t('checkout.orderSummary.labels.total')}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#757575', marginBottom: '0.25rem' }}>
                {t('checkout.orderSummary.labels.currency')}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
                ${total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutOrderSummary
