'use client'

import Link from 'next/link'

/**
 * Home page content when resale storefront layout is active.
 * Rendered as children of ResaleStorefrontLayout (header/footer come from layout).
 * Registered via sections: page 'storefront/home', position 'replace', targetSection '__root__'.
 */
export default function ResaleStorefrontHome({
  locale = 'en',
  children
}: {
  locale?: string
  children?: React.ReactNode
}) {
  return (
    <div className='px-6 py-10'>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 className='mb-2 text-2xl font-bold'>Resale – Home</h1>
        <p className='mb-6 text-neutral-600'>
          This is the resale storefront home (locale: {locale}). Header and footer come from
          ResaleStorefrontLayout; category and cart pages are reused.
        </p>
        <p className='flex gap-4'>
          <Link href='/category/clothes' className='text-primary-600 underline'>
            Categories
          </Link>
          <Link href='/cart' className='text-primary-600 underline'>
            Cart
          </Link>
        </p>
        {children}
      </div>
    </div>
  )
}
