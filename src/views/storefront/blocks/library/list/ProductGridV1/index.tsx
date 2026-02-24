'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { getLocalizedText } from '@/utils/i18n'
import { getStoreImageUrl, getMediaUrl } from '@/utils/media'
import { storefrontApi } from '@/utils/storefrontApi'
import type { BlockProps } from '../../../types'
import ProductCard from '../../../../components/ProductCard'
import styles from './styles.module.css'

interface Product {
  id: string | number
  name: string
  brand?: string
  price: number | string
  compare_price?: string
  discount_percentage?: number
  rating?: number
  reviews_count?: number
  primary_image?: string
  images?: string[]
  is_new?: boolean
}

interface ProductGridSettings {
  columns?: number
  limit?: number
  showTitle?: boolean
  altBackground?: boolean
}

interface ProductGridData {
  source?: 'auto' | 'manual'
  productType?: 'featured' | 'new' | 'bestseller' | 'all'
  title?: string | Record<string, string>
  emptyMessage?: string | Record<string, string>
  products?: Product[]
}

// Transform API product to ProductCard format (ProductCard expects id: number)
const transformProduct = (apiProduct: Product) => ({
  id: typeof apiProduct.id === 'number' ? apiProduct.id : Number(apiProduct.id),
  name: apiProduct.name,
  brand: apiProduct.brand || '',
  price: parseFloat(String(apiProduct.price || '0')),
  originalPrice: apiProduct.compare_price ? parseFloat(apiProduct.compare_price) : null,
  discount: apiProduct.discount_percentage || null,
  rating: apiProduct.rating || 0,
  reviews: apiProduct.reviews_count || 0,
  image:
    getMediaUrl(apiProduct.primary_image || (apiProduct.images && apiProduct.images[0]) || '') ||
    getStoreImageUrl('themes/PRS04099/assets/img/megnor/empty-cart.svg'),
  isNew: apiProduct.is_new || false,
})

export function ProductGridV1({
  settings,
  data,
  resolvedData,
  locale = 'en',
  isEditing,
}: BlockProps<ProductGridSettings, ProductGridData>) {
  const t = useTranslations('storefront')
  const [products, setProducts] = useState<ReturnType<typeof transformProduct>[]>([])
  const [loading, setLoading] = useState(true)

  const { columns = 4, limit = 8, showTitle = true, altBackground = false } = settings
  const { source = 'auto', productType = 'featured', title, emptyMessage } = data

  // Use resolved data from server if available
  useEffect(() => {
    if (resolvedData && Array.isArray(resolvedData)) {
      setProducts(resolvedData.slice(0, limit).map(transformProduct))
      setLoading(false)
      return
    }

    if (source === 'manual' && data.products) {
      setProducts(data.products.slice(0, limit).map(transformProduct))
      setLoading(false)
      return
    }

    // Fetch from API based on productType
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const params: Record<string, unknown> = { limit }

        switch (productType) {
          case 'featured':
            params.featured = true
            break
          case 'new':
            params.is_new = true
            break
          case 'bestseller':
            params.bestseller = true
            break
        }

        const res = await storefrontApi.getProducts(params)
        const list = Array.isArray(res) ? res : res.results || res.data || []
        setProducts(list.map(transformProduct))
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [source, productType, data.products, resolvedData, limit])

  const sectionTitle = getLocalizedText(title, locale) || t(`home.sections.${productType}Title`)
  const sectionEmptyMessage = getLocalizedText(emptyMessage, locale) || t(`home.sections.${productType}Empty`)

  const containerClass = altBackground
    ? `${styles.container} ${styles.altBackground}`
    : styles.container

  return (
    <section className={containerClass}>
      {showTitle && <h2 className={styles.title}>{sectionTitle}</h2>}

      {loading ? (
        <div className={styles.loading}>{t('common.loading')}</div>
      ) : products.length > 0 ? (
        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>{sectionEmptyMessage}</p>
      )}
    </section>
  )
}

export default ProductGridV1
