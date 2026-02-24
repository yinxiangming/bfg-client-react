'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { BlockProps } from '../../../types'
import { getStoreImageUrl, getMediaUrl } from '@/utils/media'
import { storefrontApi } from '@/utils/storefrontApi'
import styles from './styles.module.css'

interface Category {
  name: string
  slug?: string
  image?: string
  image_url?: string
  product_count?: number
}

/** Transformed category with count for display */
interface CategoryDisplay extends Pick<Category, 'name' | 'slug'> {
  count: number
  image: string
}

interface CategoryGridSettings {
  columns?: number
  limit?: number
  showCount?: boolean
  imageHeight?: string
}

interface CategoryGridData {
  source?: 'auto' | 'manual'
  categories?: Category[]
}

// Transform API category to display shape
const transformCategory = (apiCategory: Category): CategoryDisplay => ({
  name: apiCategory.name,
  slug: apiCategory.slug || apiCategory.name.toLowerCase().replace(/\s+/g, '-'),
  count: apiCategory.product_count ?? 0,
  image:
    getMediaUrl(apiCategory.image_url || apiCategory.image || '') ||
    getStoreImageUrl('modules/cp_categorylist/views/img/3-cp_categorylist.jpg'),
})

export function CategoryGridV1({
  settings,
  data,
  resolvedData,
  locale = 'en',
  isEditing,
}: BlockProps<CategoryGridSettings, CategoryGridData>) {
  const t = useTranslations('storefront')
  const [categories, setCategories] = useState<CategoryDisplay[]>([])
  const [loading, setLoading] = useState(true)

  const { columns = 4, limit = 8, showCount = true, imageHeight = '180px' } = settings
  const { source = 'auto' } = data

  // Use resolved data from server if available
  useEffect(() => {
    if (resolvedData && Array.isArray(resolvedData)) {
      setCategories(resolvedData.slice(0, limit).map(transformCategory))
      setLoading(false)
      return
    }

    if (source === 'manual' && data.categories) {
      setCategories(data.categories.slice(0, limit).map(transformCategory))
      setLoading(false)
      return
    }

    // Fetch from API
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const res = await storefrontApi.getCategories()
        const list = Array.isArray(res) ? res : res.results || res.data || []
        setCategories(list.slice(0, limit).map(transformCategory))
      } catch (err) {
        console.error('Error fetching categories:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [source, data.categories, resolvedData, limit])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loading')}</div>
      </div>
    )
  }

  if (categories.length === 0) {
    if (isEditing) {
      return (
        <div className={styles.container}>
          <div className={styles.empty}>No categories available</div>
        </div>
      )
    }
    return null
  }

  return (
    <section className={styles.container}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {categories.map((category, index) => (
          <Link
            key={`${category.slug ?? 'cat'}-${index}`}
            href={`/category/${category.slug}`}
            className={styles.card}
          >
            <img
              src={category.image}
              alt={category.name}
              className={styles.image}
              style={{ height: imageHeight }}
            />
            <div className={styles.content}>
              <h3 className={styles.name}>{category.name}</h3>
              {showCount && (
                <span className={styles.count}>
                  {category.count} {t('product.labels.items')}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CategoryGridV1
