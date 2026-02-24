'use client'

import Link from 'next/link'
import type { StorefrontLayoutProps } from '@/extensions/registry'

/**
 * Resale storefront layout: replaces default storefront layout for all storefront routes.
 * Uses resale header and footer; children = page content (home, category, cart, product, etc.).
 */
export default function ResaleStorefrontLayout({ children, locale = 'en' }: StorefrontLayoutProps) {
  return (
    <div className='flex min-bs-screen flex-col' style={{ fontFamily: 'system-ui' }}>
      <header
        className='flex items-center justify-between px-6 py-4'
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#eee' }}
      >
        <Link href='/' className='text-xl font-semibold' style={{ color: '#fff' }}>
          Resale Store
        </Link>
        <nav className='flex gap-6'>
          <Link href='/category/clothes' className='hover:underline'>
            Categories
          </Link>
          <Link href='/cart' className='hover:underline'>
            Cart
          </Link>
          <Link href='/account' className='hover:underline'>
            Account
          </Link>
        </nav>
      </header>

      <main className='flex-1'>{children}</main>

      <footer
        className='mt-auto px-6 py-6 text-center text-sm'
        style={{ background: '#0f0f1a', color: '#9ca3af' }}
      >
        <p>Resale Store © — Plugin storefront layout. Reuses category, cart, product pages.</p>
      </footer>
    </div>
  )
}
