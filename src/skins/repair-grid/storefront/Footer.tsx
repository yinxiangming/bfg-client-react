'use client'

import Link from 'next/link'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function RepairGridFooter() {
  const config = useStorefrontConfigSafe()
  return (
    <footer className='repair-grid-footer'>
      <div className='repair-grid-footer-compact'>
        <Link href='/' className='repair-grid-footer-brand'>{(config.site_name || 'Site').toUpperCase()}</Link>
        <span>{config.footer_copyright}</span>
        <Link href='/auth/login'>Staff login</Link>
      </div>
    </footer>
  )
}
