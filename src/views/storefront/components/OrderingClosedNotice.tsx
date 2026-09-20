'use client'

import type { CSSProperties } from 'react'

import { useTranslations } from 'next-intl'

/**
 * The one sentence a shopper gets where a purchase would have started.
 *
 * Shared by the product page, the basket and the checkout so all three say the same
 * thing in the same words. It says what is closed and what still works, and nothing
 * about why — that is between the shop and whoever runs it.
 */
export default function OrderingClosedNotice({ style }: { style?: CSSProperties }) {
  const t = useTranslations('storefront')

  return (
    <p className='sf-ordering-closed-note' style={style} role='status'>
      <i className='tabler-info-circle' style={{ marginInlineEnd: '0.5rem' }} />
      {t('ordering.closedNotice')}
    </p>
  )
}
