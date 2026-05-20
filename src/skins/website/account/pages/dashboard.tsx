'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useStorefrontConfig } from '@/contexts/StorefrontConfigContext'

/**
 * Website-skin dashboard. Replaces the MUI AccountDashboardClient with a
 * plain-HTML / CSS-class implementation. Pulls site name from storefront
 * config and uses the wa-* CSS classes from website-account.css.
 */
export default function WebsiteDashboardPage() {
  const t = useTranslations('account')
  const { config } = useStorefrontConfig()
  const greeting = config?.site_name?.trim()
    ? `Welcome to ${config.site_name}`
    : 'Welcome back'

  return (
    <>
      <header className='wa-page-header'>
        <h1 className='wa-page-title'>{greeting}</h1>
        <p className='wa-page-subtitle'>
          Manage orders, addresses, payments, and account preferences from one place.
        </p>
      </header>

      <section className='wa-stat-grid'>
        <ShortcutStat
          icon='tabler-shopping-cart'
          label={tryT(t, 'pages.orders.title', 'Orders')}
          description={tryT(t, 'pages.orders.subtitle', 'View and track recent purchases.')}
          href='/account/orders'
        />
        <ShortcutStat
          icon='tabler-map-pin'
          label={tryT(t, 'pages.addresses.title', 'Addresses')}
          description='Add or edit shipping and billing addresses.'
          href='/account/addresses'
        />
        <ShortcutStat
          icon='tabler-credit-card'
          label={tryT(t, 'pages.payments.title', 'Payments')}
          description='Saved payment methods and billing history.'
          href='/account/payments'
        />
        <ShortcutStat
          icon='tabler-wallet'
          label='Wallet'
          description='Manage your wallet balance and withdrawals.'
          href='/account/wallet'
        />
      </section>

      <section className='wa-card' style={{ marginTop: '1.25rem' }}>
        <h2 style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.5rem' }}>Need a hand?</h2>
        <p style={{ color: 'var(--wa-text-muted)', marginBottom: '1rem' }}>
          Visit support to open a ticket or browse our help articles.
        </p>
        <Link href='/account/support' className='wa-btn wa-btn-primary'>
          <i className='tabler-headset' />
          <span>Contact support</span>
        </Link>
      </section>
    </>
  )
}

function ShortcutStat({
  icon,
  label,
  description,
  href,
}: {
  icon: string
  label: string
  description: string
  href: string
}) {
  return (
    <Link href={href} className='wa-stat-card' style={{ textDecoration: 'none' }}>
      <span className='wa-stat-label'>
        <i className={icon} aria-hidden='true' style={{ marginRight: '0.4rem' }} />
        {label}
      </span>
      <span className='wa-stat-value' style={{ fontSize: '1.1rem', fontWeight: 600 }}>
        {description}
      </span>
    </Link>
  )
}

function tryT(t: ReturnType<typeof useTranslations>, key: string, fallback: string): string {
  try {
    const has = (t as any).has ? (t as any).has(key) : true
    if (!has) return fallback
    return t(key as any) as string
  } catch {
    return fallback
  }
}
