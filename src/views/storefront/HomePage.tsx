'use client'

import { useTranslations } from 'next-intl'
import '@/styles/storefront.css'

/**
 * Default HomePage (BFG Store): welcome message only.
 * Full home content (slides, categories, products) comes from CMS Page when configured.
 */
const HomePage = () => {
  const t = useTranslations('storefront')

  return (
    <div className='sf-container' style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 560, minHeight: 380, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          {t('home.welcomeTitle')}
        </h1>
        <p style={{ color: 'var(--sf-text-muted, #6b7280)', lineHeight: 1.6 }}>
          {t('home.welcomeSubtitle')}
        </p>
      </div>
    </div>
  )
}

export default HomePage
