'use client'

import Link from 'next/link'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function AtelierGridFooter() {
  const config = useStorefrontConfigSafe()
  return (
    <footer className='atelier-grid-footer'>
      <div className='atelier-grid-footer-compact'>
        <strong>{config?.site_name?.trim() || 'Ultimate Space Design'}</strong>
        <span>{config?.footer_copyright || '© Ultimate Space Design'}</span>
        <Link href='/contact'>Contact ↗</Link>
      </div>
    </footer>
  )
}
