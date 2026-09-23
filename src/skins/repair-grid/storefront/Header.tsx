'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function RepairGridHeader() {
  const config = useStorefrontConfigSafe()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const links = config?.header_menus?.length
    ? config.header_menus.filter((link) => link.title?.toLowerCase() !== 'home')
    : [
        { title: 'What we do', url: '/projects' },
        { title: 'Services', url: '/services' },
        { title: 'Parts', url: '/products' },
        { title: 'About', url: '/about' },
        { title: 'Contact', url: '/contact' },
      ]
  const name = config?.site_name?.trim() || 'Repair team'

  return (
    <header className='repair-grid-header' data-menu-open={open} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
      <div className='repair-grid-header-inner'>
        <Link href='/' className='repair-grid-brand' onClick={() => setOpen(false)}>{name.toUpperCase()}</Link>
        <nav id='repair-primary-nav' aria-label='Primary' className='repair-grid-nav'>
          {links.map((link) => (
            <Link key={`${link.title}-${link.url}`} href={link.url || '/'} aria-current={pathname === link.url ? 'page' : undefined} onClick={() => setOpen(false)}>
              {link.title}
            </Link>
          ))}
        </nav>
        <button className='repair-grid-menu' type='button' aria-controls='repair-primary-nav' aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}><span /><span /></button>
      </div>
    </header>
  )
}
