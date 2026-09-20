'use client'

import Link from 'next/link'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function AtelierGridFooter() {
  const config = useStorefrontConfigSafe()
  return (
    <footer className='atelier-grid-footer'>
      <div className='atelier-grid-footer-grid'>
        <div><div className='atelier-grid-footer-label'>Studio</div><strong>{config?.site_name?.trim() || 'Atelier'}</strong><p>{config?.site_description || 'Considered spaces, honest materials, useful beauty.'}</p></div>
        <div><div className='atelier-grid-footer-label'>Explore</div><Link href='/projects'>Projects</Link><Link href='/services'>Services</Link><Link href='/about'>About</Link></div>
        <div><div className='atelier-grid-footer-label'>Contact</div><Link href='/contact'>Start a conversation ↗</Link><p>By appointment or online.</p></div>
      </div>
      <div className='atelier-grid-footer-bottom'><span>{config?.footer_copyright || '© Atelier. All rights reserved.'}</span><span>Designed with intention.</span></div>
    </footer>
  )
}
