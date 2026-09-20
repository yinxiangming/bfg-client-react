'use client'

import Link from 'next/link'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function AtelierGridHeader() {
  const config = useStorefrontConfigSafe()
  const links = config?.header_menus?.length ? config.header_menus : [
    { title: 'Projects', url: '/projects' },
    { title: 'Services', url: '/services' },
    { title: 'Products', url: '/products' },
    { title: 'About', url: '/about' },
    { title: 'Contact', url: '/contact' },
  ]
  const name = config?.site_name?.trim() || 'Atelier'
  return (
    <header className='atelier-grid-header'>
      <Link href='/' className='atelier-grid-brand'><span className='atelier-grid-brand-mark' aria-hidden='true'>▦</span><span>{name}</span></Link>
      <nav className='atelier-grid-nav' aria-label='Primary'>
        {links.map(link => <Link key={`${link.title}-${link.url}`} href={link.url || '#'}>{link.title}</Link>)}
      </nav>
      <Link href='/contact' className='atelier-grid-header-cta'>Start a project <span aria-hidden='true'>↗</span></Link>
    </header>
  )
}
