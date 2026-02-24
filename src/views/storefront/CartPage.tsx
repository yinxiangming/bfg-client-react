'use client'

// React Imports
import React, { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import { useCart } from '@/contexts/CartContext'

// Util Imports
import { getStoreImageUrl } from '@/utils/media'
import { storefrontApi } from '@/utils/storefrontApi'
import { usePageSections } from '@/extensions/hooks/usePageSections'

// Import CSS
import '@/styles/storefront.css'

const CartPage = () => {
  const t = useTranslations('storefront')
  const router = useRouter()
  const { items, loading, removeItem, updateQuantity, getSubtotal } = useCart()
  const { beforeSections, afterSections } = usePageSections('storefront/cart')
  const [updating, setUpdating] = useState<number | null>(null)
  const [pricePreview, setPricePreview] = useState<{
    subtotal: number
    tax: number
  } | null>(null)

  const handleCheckout = () => {
    router.push('/checkout')
  }

  const handleRemoveItem = async (id: number) => {
    try {
      setUpdating(id)
      await removeItem(id)
    } catch (err) {
      alert(t('cart.removeFailed'))
    } finally {
      setUpdating(null)
    }
  }

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    if (quantity < 1) return
    try {
      setUpdating(id)
      await updateQuantity(id, quantity)
    } catch (err) {
      alert(t('cart.updateQtyFailed'))
    } finally {
      setUpdating(null)
    }
  }

  // Fetch price preview (subtotal and tax only, no shipping)
  useEffect(() => {
    const fetchPricePreview = async () => {
      if (items.length === 0) {
        setPricePreview(null)
        return
      }
      try {
        // Call API without shipping_method to get subtotal and tax only
        const preview = await storefrontApi.getCartPreview()
        setPricePreview({
          subtotal: parseFloat(preview.subtotal),
          tax: parseFloat(preview.tax)
        })
      } catch (error) {
        console.error('Failed to fetch price preview:', error)
        // Fallback to local calculation
        const localSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        setPricePreview({
          subtotal: localSubtotal,
          tax: localSubtotal * 0.1 // 10% tax
        })
      }
    }
    
    fetchPricePreview()
  }, [items])

  // Use preview prices if available, otherwise fallback to local calculation
  const subtotal = pricePreview?.subtotal ?? getSubtotal()
  const tax = pricePreview?.tax ?? (subtotal * 0.1)
  const subtotalWithTax = subtotal + tax
  // Calculate tax rate percentage
  const taxRate = subtotal > 0 ? (tax / subtotal) * 100 : 0

  if (items.length === 0) {
    return (
      <div className='sf-container' style={{ padding: '4rem 1rem' }}>
        {beforeSections.map(
          ext =>
            ext.component && (
              <div key={ext.id} style={{ marginBottom: '1.5rem' }}>
                <ext.component />
              </div>
            )
        )}
        {/* Breadcrumbs */}
        <nav style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          <Link href='/' style={{ color: '#757575', textDecoration: 'none' }}>
            {t('nav.home')}
          </Link>
          <span style={{ margin: '0 0.5rem', color: '#757575' }}>/</span>
          <span style={{ color: '#2c3e50' }}>{t('cart.title')}</span>
        </nav>

        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <img
            src={getStoreImageUrl('themes/PRS04099/assets/img/megnor/empty-cart.svg')}
            alt={t('cart.emptyTitle')}
            style={{ width: '200px', height: '200px', margin: '0 auto 2rem' }}
          />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#2c3e50' }}>
            {t('cart.emptyTitle')}
          </h2>
          <p style={{ color: '#757575', marginBottom: '1.5rem' }}>
            {t('cart.emptyDesc')}
          </p>
          <Link href='/' className='sf-btn sf-btn-primary' style={{ textDecoration: 'none', color: 'white' }}>
            {t('buttons.continueShopping')}
          </Link>
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
    )
  }

  return (
    <div className='sf-container' style={{ padding: '2rem 1rem' }}>
      {beforeSections.map(
        ext =>
          ext.component && (
            <div key={ext.id} style={{ marginBottom: '1.5rem' }}>
              <ext.component items={items} />
            </div>
          )
      )}
      {/* Breadcrumbs */}
      <nav className='sf-breadcrumb'>
        <Link href='/' style={{ color: '#757575', textDecoration: 'none' }}>
          {t('nav.home')}
        </Link>
        <span style={{ margin: '0 0.5rem', color: '#757575' }}>/</span>
        <span style={{ color: '#2c3e50' }}>{t('cart.title')}</span>
      </nav>

      <h1 className='sf-cart-title'>{t('cart.title')}</h1>

      <div className='sf-cart-layout'>
        {/* Left: Cart Items */}
        <div className='sf-cart-items'>
          {items.map(item => (
              <div key={item.id} className='sf-card sf-cart-item'>
                <div className='sf-cart-item-content'>
                  <img
                    src={item.image}
                    alt={item.name}
                    className='sf-cart-item-image'
                  />
                  <div className='sf-cart-item-details'>
                    <div className='sf-cart-item-header'>
                      <div className='sf-cart-item-info'>
                        <h3 className='sf-cart-item-name'>
                          {item.brand} {item.name}
                        </h3>
                        <p className='sf-cart-item-attr'>
                          {t('cart.labels.size')} {item.size}
                        </p>
                        <p className='sf-cart-item-attr'>
                          {t('cart.labels.color')} {item.color}
                        </p>
                        <p className='sf-cart-item-price'>
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updating === item.id || loading}
                        className='sf-cart-item-remove'
                        title={t('cart.labels.removeItemTitle')}
                      >
                        <i className='tabler-trash' />
                      </button>
                    </div>
                    <div className='sf-cart-item-actions'>
                      <div className='sf-cart-item-quantity'>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updating === item.id || loading}
                          className='sf-quantity-btn'
                          style={{ opacity: item.quantity <= 1 ? 0.5 : 1 }}
                        >
                          <i className='tabler-minus' />
                        </button>
                        <input
                          type='number'
                          value={item.quantity}
                          onChange={e => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                          disabled={updating === item.id || loading}
                          className='sf-quantity-input'
                          min='1'
                        />
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updating === item.id || loading}
                          className='sf-quantity-btn'
                        >
                          <i className='tabler-plus' />
                        </button>
                      </div>
                      <p className='sf-cart-item-total'>
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          <Link href='/' className='sf-continue-shopping'>
            <i className='tabler-arrow-left' />
            {t('cart.continueShopping')}
          </Link>
        </div>

        {/* Right: Order Summary */}
        <div className='sf-cart-summary'>
          <div className='sf-card' style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#2c3e50' }}>
              {t('cart.orderSummary.title')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: '#757575' }}>
                    {t('cart.orderSummary.itemsCount', { count: items.length })}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: '#757575' }}>
                    {t('cart.orderSummary.tax', { percent: taxRate.toFixed(0) })}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>${tax.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    borderTop: '1px solid #e0e0e0',
                    marginTop: '0.5rem',
                    paddingTop: '0.75rem'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: '#757575' }}>{t('cart.orderSummary.subtotalTaxIncl')}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>${subtotalWithTax.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#757575',
                    lineHeight: '1.4'
                  }}
                >
                  <i className='tabler-info-circle' style={{ marginRight: '0.5rem' }} />
                  {t('cart.orderSummary.shippingNote')}
                </div>
            </div>
            <button
              onClick={handleCheckout}
              className='sf-btn sf-btn-primary sf-btn-full'
              style={{ fontSize: '1rem', padding: '0.875rem', marginBottom: '1.5rem' }}
            >
              {t('cart.orderSummary.checkout')}
            </button>

            {/* Policies */}
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '1rem' }}>
                  <i className='tabler-lock' style={{ fontSize: '1.25rem', color: '#757575' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{t('cart.orderSummary.policies.security')}</p>
                    <p style={{ fontSize: '0.75rem', color: '#757575' }}>
                      {t('cart.orderSummary.policies.editHint')}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '1rem' }}>
                  <i className='tabler-truck' style={{ fontSize: '1.25rem', color: '#757575' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{t('cart.orderSummary.policies.delivery')}</p>
                    <p style={{ fontSize: '0.75rem', color: '#757575' }}>
                      {t('cart.orderSummary.policies.editHint')}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  <i className='tabler-hand-rock' style={{ fontSize: '1.25rem', color: '#757575' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{t('cart.orderSummary.policies.return')}</p>
                    <p style={{ fontSize: '0.75rem', color: '#757575' }}>
                      {t('cart.orderSummary.policies.editHint')}
                    </p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {afterSections.map(
        ext =>
          ext.component && (
            <div key={ext.id} style={{ marginTop: '1.5rem' }}>
              <ext.component items={items} />
            </div>
          )
      )}
    </div>
  )
}

export default CartPage
