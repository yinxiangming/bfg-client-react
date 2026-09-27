'use client'

import Link from 'next/link'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function AtelierGridFooter() {
  const config = useStorefrontConfigSafe()
  return (
    <footer className='atelier-grid-footer'>
      <div className='atelier-grid-footer-compact'>
        <strong>{config?.site_name?.trim() || 'Site'}</strong>
        <span>{config?.footer_copyright || ''}</span>
        <Link href='/contact'>Contact ↗</Link>
      </div>
    </footer>
  )
}
