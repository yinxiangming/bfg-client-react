'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { getProductOwnerInfo, type ProductOwnerInfo } from '../services/resale'

/**
 * Storefront product page section: shows resale/owner info when product has an owner.
 * Fetches owner info from resale API by product_id (no coupling to shop or product serializer).
 */

type Product = {
  id: number
  name: string
  brand: string
  price: number
  [key: string]: unknown
}

type ResaleProductInfoSectionProps = {
  product: Product
  productId: string
  resaleInfo?: ProductOwnerInfo | null
}

export default function ResaleProductInfoSection({
  product,
  productId
}: ResaleProductInfoSectionProps) {
  const t = useTranslations('resale')
  const [ownerInfo, setOwnerInfo] = useState<ProductOwnerInfo | null>(null)

  useEffect(() => {
    const productIdNum = typeof productId === 'string' ? parseInt(productId, 10) : productId
    if (!Number.isFinite(productIdNum)) return
    getProductOwnerInfo(productIdNum)
      .then(setOwnerInfo)
      .catch(() => setOwnerInfo(null))
  }, [productId])

  if (!ownerInfo?.has_owner) return null

  return (
    <div
      className='sf-card'
      style={{
        padding: '1rem 1.25rem',
        marginTop: '1rem',
        borderRadius: '8px',
        border: '1px solid var(--sf-border, #e5e7eb)',
        backgroundColor: 'var(--sf-bg-muted, #f9fafb)'
      }}
    >
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--sf-text-secondary, #6b7280)' }}>
        {t('storefront.resaleItemSold')}
      </p>
    </div>
  )
}
