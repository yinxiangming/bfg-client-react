'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

// Next Imports
import Link from 'next/link'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import ProductCard from './components/ProductCard'
import ImageViewerDialog from '@/components/ui/ImageViewerDialog'
import { useCart } from '@/contexts/CartContext'

// Util Imports
import { getStoreImageUrl, getMediaUrl } from '@/utils/media'
import { storefrontApi } from '@/utils/storefrontApi'
import { usePageSections } from '@/extensions/hooks/usePageSections'
import { authApi } from '@/utils/authApi'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

// Import CSS
import '@/styles/storefront.css'

type Product = {
  id: number
  name: string
  brand: string
  condition: string
  price: number
  originalPrice: number | null
  discount: number | null
  rating: number
  reviews: number
  images: string[]
  description: string
  reference: string
  stock: number
  sizes: string[]
  colors: { name: string; value: string }[]
}

const ProductDetailPage = ({ productId }: { productId: string }) => {
  const t = useTranslations('storefront')
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description')
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [helpfulSent, setHelpfulSent] = useState<Set<number>>(new Set())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { addItem, loading: cartLoading } = useCart()
  const { beforeSections, afterSections } = usePageSections('storefront/product')
  const storefrontConfig = useStorefrontConfigSafe()

  const fetchReviews = useCallback(async (pid: string) => {
    setReviewsLoading(true)
    try {
      const list = await storefrontApi.getProductReviews(pid)
      setReviews(Array.isArray(list) ? list : [])
    } catch {
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') setIsAuthenticated(authApi.isAuthenticated())
  }, [])
  const afterProductInfoSections = afterSections.filter(e => e.targetSection === 'ProductInfo')
  const afterContentSections = afterSections.filter(e => e.targetSection !== 'ProductInfo')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)

        const productData = await storefrontApi.getProduct(productId)

        // Store variants for later use
        const productVariants = productData.variants || []
        setVariants(productVariants)

        const transformedProduct: Product = {
          id: productData.id,
          name: productData.name,
          brand: productData.brand || '',
          condition: productData.condition || '',
          price: parseFloat(productData.price || '0'),
          originalPrice: productData.compare_price ? parseFloat(productData.compare_price) : null,
          discount: productData.discount_percentage || null,
          rating: productData.rating || 0,
          reviews: productData.reviews_count || 0,
          images:
            productData.images && productData.images.length > 0
              ? productData.images.map((img: string) => getMediaUrl(img))
              : productData.primary_image
                ? [getMediaUrl(productData.primary_image)]
                : [getStoreImageUrl('themes/PRS04099/assets/img/megnor/empty-cart.svg')],
          description: productData.description || t('product.descriptionFallback'),
          reference: productData.sku || '',
          stock: productVariants.length
            ? productVariants.reduce((sum: number, v: any) => sum + (v.stock_available || 0), 0) || 0
            : (productData.stock_quantity ?? 0),
          sizes: productVariants.map((v: any) => v.options?.size).filter(Boolean) || [],
          colors:
            productVariants
              ?.map((v: any) => ({
                name: v.options?.color || v.name,
                value: v.options?.color || '#000000'
              }))
              .filter((c: any) => c.name) || []
        }
        setProduct(transformedProduct)

        // Set default selections
        if (transformedProduct.sizes.length > 0) setSelectedSize(transformedProduct.sizes[0])
        if (transformedProduct.colors.length > 0) setSelectedColor(transformedProduct.colors[0].name)

        // Fetch related products
        try {
          if (productData.categories && productData.categories.length > 0) {
            const categorySlug = productData.categories[0].slug
            const relatedRes = await storefrontApi.getProducts({ category: categorySlug, limit: 4 })
            const relatedList = Array.isArray(relatedRes) ? relatedRes : relatedRes.results || relatedRes.data || []
            setRelatedProducts(
              relatedList
                .filter((p: any) => p.id !== productData.id)
                .slice(0, 4)
                .map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  brand: p.brand || '',
                  price: parseFloat(p.price || '0'),
                  originalPrice: p.compare_price ? parseFloat(p.compare_price) : null,
                  discount: p.discount_percentage || null,
                  rating: p.rating || 0,
                  reviews: p.reviews_count || 0,
                  image:
                    getMediaUrl(p.primary_image || (p.images && p.images[0]) || '') ||
                    getStoreImageUrl('themes/PRS04099/assets/img/megnor/empty-cart.svg'),
                  isNew: p.is_new || false
                }))
            )
          }
        } catch (err) {
          console.warn('Failed to fetch related products:', err)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(t('product.errors.loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  useEffect(() => {
    if (activeTab === 'reviews' && productId) fetchReviews(productId)
  }, [activeTab, productId, fetchReviews])

  const handleAddToCart = async () => {
    if (!product) return
    
    // Find variant ID based on selected size and color
    let variantId: number | undefined = undefined
    if (variants.length > 0) {
      const matchingVariant = variants.find((v: any) => {
        const sizeMatch = !selectedSize || v.options?.size === selectedSize
        const colorMatch = !selectedColor || v.options?.color === selectedColor
        return sizeMatch && colorMatch
      })
      
      // If no exact match, try to find by size only, then color only
      if (!matchingVariant) {
        if (selectedSize) {
          const sizeVariant = variants.find((v: any) => v.options?.size === selectedSize)
          if (sizeVariant) variantId = sizeVariant.id
        } else if (selectedColor) {
          const colorVariant = variants.find((v: any) => v.options?.color === selectedColor)
          if (colorVariant) variantId = colorVariant.id
        }
      } else {
        variantId = matchingVariant.id
      }
      
      // If still no variant found and there's only one variant, use it
      if (!variantId && variants.length === 1) {
        variantId = variants[0].id
      }
    }
    
    try {
      await addItem({
        productId: product.id,
        variantId: variantId,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.images[0],
        size: selectedSize,
        color: selectedColor,
        quantity
      })
      alert(t('product.alerts.addedToCart'))
    } catch (err) {
      console.error('Failed to add to cart:', err)
      const errorMessage = err instanceof Error ? err.message : t('product.alerts.addFailed')
      alert(errorMessage)
    }
  }

  const renderStars = (rating: number, size = '1rem') => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      stars.push(
        <i
          key={i}
          className={i < Math.floor(rating) ? 'tabler-star-filled' : 'tabler-star'}
          style={{ color: '#fbbf24', fontSize: size }}
        />
      )
    }
    return stars
  }

  const handleSubmitReview = async () => {
    if (!productId || !reviewForm.comment.trim()) return
    setReviewSubmitting(true)
    try {
      await storefrontApi.createProductReview(productId, {
        rating: reviewForm.rating,
        title: reviewForm.title.trim() || undefined,
        comment: reviewForm.comment.trim()
      })
      setReviewForm({ rating: 5, title: '', comment: '' })
      setProduct(prev => (prev ? { ...prev, reviews: prev.reviews + 1 } : null))
      const successMsg = storefrontConfig?.review_moderation_required
        ? t('product.tabs.submitSuccess')
        : t('product.tabs.submitSuccessImmediate')
      alert(successMsg)
      fetchReviews(productId)
    } catch (err: any) {
      const msg = err?.status === 401
        ? t('product.errors.loginRequiredForReview')
        : (err?.message || t('product.errors.loadFailed'))
      alert(msg)
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleMarkHelpful = async (reviewId: number) => {
    if (!productId || helpfulSent.has(reviewId)) return
    try {
      await storefrontApi.markProductReviewHelpful(productId, reviewId)
      setHelpfulSent(prev => new Set(prev).add(reviewId))
      setReviews(prev =>
        prev.map(r => (r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r))
      )
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className='sf-container' style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p className='sf-text-muted'>{t('common.loading')}</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className='sf-container' style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2 className='sf-section-title' style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          {error || t('product.errors.notFound')}
        </h2>
        <Link href='/' className='sf-btn sf-btn-primary' style={{ textDecoration: 'none', color: 'white' }}>
          {t('product.links.backToHome')}
        </Link>
      </div>
    )
  }

  const conditionKey = product.condition ? `product.condition.${product.condition}` : ''
  const conditionLabel = conditionKey
    ? (() => {
        const label = t(conditionKey as any)
        return label && label !== conditionKey ? label : product.condition
      })()
    : ''
  const displayConditionLabel = conditionLabel || t('product.condition.notSet')

  return (
    <div className='sf-container sf-product-detail-page'>
      {beforeSections.map(
        ext =>
          ext.component && (
            <div key={ext.id} style={{ marginBottom: '1.5rem' }}>
              <ext.component product={product} productId={productId} />
            </div>
          )
      )}
      {/* Breadcrumbs */}
      <nav className='sf-breadcrumb-nav' style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <Link href='/' className='sf-breadcrumb-link' style={{ textDecoration: 'none' }}>
          {t('nav.home')}
        </Link>
        <span className='sf-breadcrumb-separator' style={{ margin: '0 0.5rem' }}>/</span>
        <Link href='/category/clothes' className='sf-breadcrumb-link' style={{ textDecoration: 'none' }}>
          {t('category.sidebar.sampleClothes')}
        </Link>
        <span className='sf-breadcrumb-separator' style={{ margin: '0 0.5rem' }}>/</span>
        <span className='sf-breadcrumb-current'>{product.name}</span>
      </nav>

      {/* Product Main Section - responsive grid: 1 col mobile, 2 col desktop */}
      <div className='sf-product-detail-layout'>
        {/* Product Images */}
        <div className='sf-product-detail-gallery'>
          <div
            className='sf-product-detail-main-image'
            role='button'
            tabIndex={0}
            onClick={() => setImageViewerOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setImageViewerOpen(true) }}
            style={{ cursor: 'pointer' }}
            aria-label='View full size'
          >
            <img
              src={product.images[selectedImage]}
              alt={product.name}
            />
          </div>
          <ImageViewerDialog
            open={imageViewerOpen}
            onClose={() => setImageViewerOpen(false)}
            images={product.images.map((url) => ({ url, alt: product.name }))}
            initialIndex={selectedImage}
          />
          <div className='sf-product-detail-thumbnails'>
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type='button'
                onClick={() => setSelectedImage(idx)}
                className='sf-product-detail-thumb'
                aria-pressed={selectedImage === idx}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={img} alt={`${product.name} ${idx + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className='sf-product-detail-info'>
          <div className='sf-product-title-row'>
            <h1 className='sf-product-title'>
              {product.brand} {product.name}
            </h1>
            <span
              className={`sf-condition-badge sf-condition-${product.condition || 'notSet'}`}
              title={t('product.labels.condition')}
            >
              {displayConditionLabel}
            </span>
          </div>
          <div className='sf-product-detail-meta'>
            <div className='sf-product-stars'>{renderStars(product.rating)}</div>
            <span className='sf-text-muted sf-product-reviews-count'>
              ({product.reviews} {t('product.labels.reviews')})
            </span>
          </div>
          <div className='sf-product-detail-price-row'>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color, #6366f1)' }}>
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className='sf-price-original' style={{ fontSize: '1.25rem', textDecoration: 'line-through' }}>
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
            {product.discount && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                -{product.discount}%
              </span>
            )}
          </div>
          <div
            className='sf-product-description'
            style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}
            dangerouslySetInnerHTML={{ __html: product.description || '' }}
          />

          {/* Size Selection */}
          {product.sizes.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className='sf-form-label' style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('product.labels.size')}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {product.sizes.map(size => (
                  <button
                    key={size}
                    className='sf-option-btn'
                    onClick={() => setSelectedSize(size)}
                    data-selected={selectedSize === size}
                    style={{
                      padding: '0.5rem 1rem',
                      border: selectedSize === size ? '2px solid var(--primary-color, #6366f1)' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className='sf-form-label' style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {t('product.labels.color')}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    className='sf-option-btn'
                    onClick={() => setSelectedColor(color.name)}
                    data-selected={selectedColor === color.name}
                    style={{
                      padding: '0.5rem 1rem',
                      border:
                        selectedColor === color.name ? '2px solid var(--primary-color, #6366f1)' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className='sf-form-label' style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('product.labels.quantity')}
            </label>
            <div
              className='sf-quantity-selector'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '0.25rem'
              }}
            >
              <button
                className='sf-quantity-btn'
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <i className='tabler-minus' />
              </button>
              <input
                type='number'
                className='sf-quantity-input'
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '60px',
                  textAlign: 'center',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
                min='1'
              />
              <button
                className='sf-quantity-btn'
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <i className='tabler-plus' />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={cartLoading}
            className='sf-btn sf-btn-primary'
            style={{ width: '100%', fontSize: '1rem', padding: '1rem', marginBottom: '1rem' }}
          >
            <i className='tabler-shopping-cart' style={{ marginRight: '0.5rem' }} />
            {cartLoading ? t('buttons.adding') : t('buttons.addToCart')}
          </button>

          {/* Product Info */}
          <div className='sf-product-info-box'>
            <p className='sf-product-info-item'>
              <strong className='sf-product-info-label'>{t('product.labels.reference')}</strong>{' '}
              <span className='sf-product-info-value'>{product.reference}</span>
            </p>
            <p className='sf-product-info-item'>
              <strong className='sf-product-info-label'>{t('product.labels.inStock')}</strong>{' '}
              <span className='sf-product-info-value'>
                {product.stock} {t('product.labels.items')}
              </span>
            </p>
          </div>
          {/* Extension sections after ProductInfo (e.g. Resale owner info) */}
          {afterProductInfoSections.map(
            ext =>
              ext.component && (
                <div key={ext.id} style={{ marginTop: '1rem' }}>
                  <ext.component product={product} productId={productId} />
                </div>
              )
          )}
        </div>
      </div>

      {/* Product Tabs */}
      <div className='sf-card' style={{ padding: '0', marginBottom: '3rem' }}>
        <div className='sf-product-detail-tabs' style={{ borderBottom: '1px solid #e0e0e0', display: 'flex' }}>
          <button
            onClick={() => setActiveTab('description')}
            className='sf-tab-btn'
            data-active={activeTab === 'description'}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              borderBottom: activeTab === 'description' ? '2px solid var(--primary-color, #6366f1)' : 'none'
            }}
          >
            {t('product.tabs.description')}
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className='sf-tab-btn'
            data-active={activeTab === 'details'}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              borderBottom: activeTab === 'details' ? '2px solid var(--primary-color, #6366f1)' : 'none'
            }}
          >
            {t('product.tabs.details')}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className='sf-tab-btn'
            data-active={activeTab === 'reviews'}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
              borderBottom: activeTab === 'reviews' ? '2px solid var(--primary-color, #6366f1)' : 'none'
            }}
          >
            {t('product.tabs.reviews')} ({product.reviews})
          </button>
        </div>
        <div style={{ padding: '2rem' }}>
          {activeTab === 'description' && (
            <div
              className='sf-text-muted sf-product-description-content'
              style={{ lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: product.description || '' }}
            />
          )}
          {activeTab === 'details' && (
            <div className='sf-product-details-grid'>
              <div className='sf-detail-item'>
                <strong className='sf-detail-label'>{t('product.labels.condition')}</strong>
                <span className='sf-detail-value'>{displayConditionLabel}</span>
              </div>
              <div className='sf-detail-item'>
                <strong className='sf-detail-label'>{t('product.labels.brand')}</strong>
                <span className='sf-detail-value'>{product.brand}</span>
              </div>
              <div className='sf-detail-item'>
                <strong className='sf-detail-label'>{t('product.labels.reference')}</strong>
                <span className='sf-detail-value'>{product.reference}</span>
              </div>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className='sf-product-reviews' style={{ padding: 0 }}>
              {reviewsLoading ? (
                <p className='sf-text-muted' style={{ padding: '2rem 0' }}>{t('common.loading')}</p>
              ) : (
                <>
                  {reviews.length === 0 && !isAuthenticated && (
                    <p className='sf-text-muted' style={{ padding: '2rem 0' }}>
                      {t('product.tabs.noReviews')}
                      <span style={{ display: 'block', marginTop: '0.5rem' }}>
                        {t('product.tabs.loginToReview')}{' '}
                        <Link href='/auth/login' style={{ color: 'var(--primary-color, #6366f1)', fontWeight: 600 }}>{t('topBar.login')}</Link>
                      </span>
                    </p>
                  )}
                  {reviews.length > 0 && (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {reviews.map((rev: any) => (
                        <li
                          key={rev.id}
                          style={{
                            borderBottom: '1px solid #eee',
                            padding: '1.25rem 0'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ display: 'inline-flex' }}>{renderStars(rev.rating || 0, '0.875rem')}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{rev.customer_name || t('product.labels.reviews')}</span>
                            {rev.is_verified_purchase && (
                              <span className='sf-text-muted' style={{ fontSize: '0.75rem' }}>({t('product.tabs.verifiedPurchase')})</span>
                            )}
                          </div>
                          {rev.title && (
                            <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0', fontSize: '0.9375rem' }}>{rev.title}</p>
                          )}
                          <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.5 }}>{rev.comment || ''}</p>
                          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                              type='button'
                              onClick={() => handleMarkHelpful(rev.id)}
                              disabled={helpfulSent.has(rev.id)}
                              className='sf-btn'
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8125rem',
                                border: '1px solid #e0e0e0',
                                background: 'transparent',
                                cursor: helpfulSent.has(rev.id) ? 'default' : 'pointer'
                              }}
                            >
                              <i className='tabler-thumb-up' style={{ marginRight: '0.25rem' }} />
                              {t('product.tabs.wasHelpful')}
                              {rev.helpful_count > 0 && ` · ${t('product.tabs.helpfulCount', { count: rev.helpful_count })}`}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!isAuthenticated && reviews.length > 0 && (
                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{t('product.tabs.writeReview')}</h3>
                      <p className='sf-text-muted' style={{ margin: 0, fontSize: '0.875rem' }}>
                        {t('product.tabs.loginToReview')}{' '}
                        <Link href='/auth/login' style={{ color: 'var(--primary-color, #6366f1)', fontWeight: 600 }}>{t('topBar.login')}</Link>
                      </p>
                    </div>
                  )}
                  {isAuthenticated && (
                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                      <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>{t('product.tabs.writeReview')}</h3>
                      <div style={{ marginBottom: '1rem' }}>
                        <label className='sf-form-label' style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          {t('product.tabs.yourRating')}
                        </label>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type='button'
                              onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.25rem'
                              }}
                              aria-label={`${star} stars`}
                            >
                              <i
                                className={star <= reviewForm.rating ? 'tabler-star-filled' : 'tabler-star'}
                                style={{ color: '#fbbf24', fontSize: '1.5rem' }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label className='sf-form-label' style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          {t('product.tabs.reviewTitle')}
                        </label>
                        <input
                          type='text'
                          value={reviewForm.title}
                          onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                          className='sf-input'
                          style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid var(--sf-input-border, #c9cdd0)',
                            borderRadius: '6px'
                          }}
                          placeholder={t('product.tabs.reviewTitle')}
                        />
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label className='sf-form-label' style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          {t('product.tabs.reviewComment')} *
                        </label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                          className='sf-input'
                          rows={4}
                          style={{
                            width: '100%',
                            maxWidth: '500px',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid var(--sf-input-border, #c9cdd0)',
                            borderRadius: '6px'
                          }}
                          placeholder={t('product.tabs.reviewComment')}
                        />
                      </div>
                      <button
                        type='button'
                        onClick={handleSubmitReview}
                        disabled={reviewSubmitting || !reviewForm.comment.trim()}
                        className='sf-btn sf-btn-primary'
                        style={{ padding: '0.5rem 1.5rem' }}
                      >
                        {reviewSubmitting ? t('common.loading') : t('product.tabs.submitReview')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className='sf-section-title' style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>
            {t('product.relatedTitle')}
          </h2>
          <div className='sf-grid sf-grid-cols-4'>
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
      {afterContentSections.map(
        ext =>
          ext.component && (
            <div key={ext.id} style={{ marginTop: '1.5rem' }}>
              <ext.component product={product} productId={productId} />
            </div>
          )
      )}
    </div>
  )
}

export default ProductDetailPage
