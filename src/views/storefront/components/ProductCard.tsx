'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// i18n Imports
import { useTranslations } from 'next-intl'

// Util Imports
import { getStoreImageUrl } from '@/utils/media'
import { useCart } from '@/contexts/CartContext'

type Product = {
  id: number
  name: string
  brand: string
  price: number
  originalPrice: number | null
  discount: number | null
  rating: number
  reviews: number
  image: string
  isNew: boolean
}

const ProductCard = ({ product }: { product: Product }) => {
  const t = useTranslations('storefront')
  const [isHovered, setIsHovered] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const { addItem, loading } = useCart()

  const handleAddToCart = async () => {
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        size: '',
        color: '',
        quantity: 1
      })
      setSnackbarMessage(t('product.alerts.addedToCart'))
      setSnackbarSeverity('success')
      setSnackbarOpen(true)
      setTimeout(() => setSnackbarOpen(false), 3000)
    } catch (err: any) {
      console.error('Failed to add product to cart:', err)
      let errorMessage = t('product.alerts.addFailed')

      if (err instanceof Error) {
        errorMessage = err.message || errorMessage
      } else if (err?.data) {
        errorMessage = err.data.detail || err.data.message || err.data.error || errorMessage
      } else if (typeof err === 'string') {
        errorMessage = err
      }

      if (err?.status) {
        const statusText = err.statusText || ''
        if (statusText) {
          errorMessage = `${errorMessage} (${err.status} ${statusText})`
        } else {
          errorMessage = `${errorMessage} (Status: ${err.status})`
        }
      }

      setSnackbarMessage(errorMessage)
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      setTimeout(() => setSnackbarOpen(false), 3000)
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className='tabler-star-filled' />)
    }
    if (hasHalfStar) {
      stars.push(<i key='half' className='tabler-star-half-filled' />)
    }
    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className='tabler-star' />)
    }
    return stars
  }

  return (
    <div
      className='sf-card sf-product-card'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='sf-product-img-wrapper'>
        <img
          src={product.image || getStoreImageUrl('themes/PRS04099/assets/img/megnor/empty-cart.svg')}
          alt={product.name}
          className='sf-card-img'
        />
        <div className='sf-product-actions'>
          <button className='sf-action-btn' title={t('product.actions.addToWishlist')}>
            <i className='tabler-heart' style={{ fontSize: '1.125rem' }} />
          </button>
          <button className='sf-action-btn' title={t('product.actions.addToCompare')}>
            <i className='tabler-scale' style={{ fontSize: '1.125rem' }} />
          </button>
        </div>
        {product.isNew && <span className='sf-product-badge sf-badge-new'>{t('product.badges.new')}</span>}
        {product.discount && <span className='sf-product-badge sf-badge-sale'>-{product.discount}%</span>}
      </div>

      <div className='sf-card-body'>
        <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3 className='sf-card-title' title={product.name}>
            {product.brand} {product.name}
          </h3>
        </Link>

        <div className='sf-rating'>
          <div className='sf-stars'>{renderStars(product.rating)}</div>
          <span className='sf-review-count'>({product.reviews})</span>
        </div>

        <div className='sf-price'>
          <span className='sf-price-current'>${product.price.toFixed(2)}</span>
          {product.originalPrice && <span className='sf-price-original'>${product.originalPrice.toFixed(2)}</span>}
        </div>

        <button
          className='sf-btn sf-btn-primary sf-btn-full'
          onClick={handleAddToCart}
          disabled={loading}
          style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s' }}
        >
          <i className='tabler-shopping-cart' />
          {t('buttons.addToCart')}
        </button>
      </div>

      {/* Snackbar */}
      {snackbarOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: snackbarSeverity === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <i className={snackbarSeverity === 'success' ? 'tabler-check' : 'tabler-x'} />
          {snackbarMessage}
        </div>
      )}
    </div>
  )
}

export default ProductCard
