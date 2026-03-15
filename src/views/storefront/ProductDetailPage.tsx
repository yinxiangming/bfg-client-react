'use client'

// React Imports
import { useState, useEffect } from 'react'

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
  const { addItem, loading: cartLoading } = useCart()
  const { beforeSections, afterSections } = usePageSections('storefront/product')
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

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      stars.push(
        <i
          key={i}
          className={i < Math.floor(rating) ? 'tabler-star-filled' : 'tabler-star'}
          style={{ color: '#fbbf24', fontSize: '1rem' }}
        />
      )
    }
    return stars
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
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p className='sf-text-muted'>{t('product.tabs.noReviews')}</p>
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
