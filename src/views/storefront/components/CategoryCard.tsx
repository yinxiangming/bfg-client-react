'use client'

// Next Imports
import Link from 'next/link'

// i18n Imports
import { useTranslations } from 'next-intl'

// Util Imports
import { getStoreImageUrl, getMediaUrl } from '@/utils/media'

type Category = {
  name: string
  count: number
  image: string
}

const CategoryCard = ({ category }: { category: Category }) => {
  const t = useTranslations('storefront')

  return (
    <Link href={`/category/${category.name.toLowerCase()}`} style={{ textDecoration: 'none' }}>
      <div className='sf-card'>
        <img
          src={getMediaUrl(category.image) || getStoreImageUrl('img/c/3-0_thumb.jpg')}
          alt={category.name}
          style={{ width: '100%', height: '180px', objectFit: 'cover', backgroundColor: '#fafafa' }}
        />
        <div className='sf-card-body' style={{ padding: '0.875rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#2c3e50', margin: 0 }}>{category.name}</h3>
            <span style={{ fontSize: '0.75rem', color: '#757575' }}>
              {category.count} {t('product.labels.items')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CategoryCard
