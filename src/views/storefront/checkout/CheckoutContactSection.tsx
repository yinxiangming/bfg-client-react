'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { CheckoutFormData } from './types'

type Props = {
  formData: CheckoutFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

const CheckoutContactSection = ({ formData, onChange }: Props) => {
  const t = useTranslations('storefront')

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#2c3e50' }}>{t('checkout.contact.title')}</h2>
        <Link href='/auth/login' style={{ fontSize: '0.875rem', color: '#6366f1', textDecoration: 'none' }}>
          {t('checkout.contact.signIn')}
        </Link>
      </div>
      <input
        type='email'
        name='email'
        placeholder={t('checkout.contact.emailPlaceholder')}
        value={formData.email}
        onChange={onChange}
        required
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          border: '1px solid #d0d0d0',
          borderRadius: '8px',
          fontSize: '0.875rem',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
        onBlur={(e) => e.target.style.borderColor = '#d0d0d0'}
      />
    </div>
  )
}

export default CheckoutContactSection
