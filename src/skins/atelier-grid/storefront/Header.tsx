'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function AtelierGridHeader() {
  const config = useStorefrontConfigSafe()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const links = config?.header_menus?.length ? config.header_menus : [
    { title: 'Projects', url: '/projects' },
    { title: 'Services', url: '/services' },
    { title: 'Products', url: '/products' },
    { title: 'About', url: '/about' },
    { title: 'Contact', url: '/contact' },
  ]
  const name = config?.site_name?.trim() || 'Atelier'
  return (
    <header className='atelier-grid-header' data-menu-open={open} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
      <Link href='/' className='atelier-grid-brand' onClick={() => setOpen(false)}>{name.toUpperCase()}</Link>
      <nav id='atelier-primary-nav' className='atelier-grid-nav' aria-label='Primary'>
        {links.map(link => <Link key={`${link.title}-${link.url}`} href={link.url || '/'} aria-current={pathname === link.url ? 'page' : undefined} onClick={() => setOpen(false)}>{link.title}</Link>)}
      </nav>
      <button className='atelier-grid-menu' type='button' aria-controls='atelier-primary-nav' aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}><span /><span /></button>
    </header>
  )
}
