'use client'

import Link from 'next/link'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function ProjectGridHeader() {
  const config = useStorefrontConfigSafe()
  const links = config?.header_menus?.length ? config.header_menus : [{ title: 'Projects', url: '/projects' }, { title: 'Services', url: '/services' }, { title: 'Products', url: '/products' }, { title: 'About', url: '/about' }, { title: 'Contact', url: '/contact' }]
  const name = config?.site_name?.trim() || 'Project studio'
  return <header className='project-grid-header'><div className='project-grid-header-inner'><Link href='/' className='project-grid-brand'><span className='project-grid-mark' aria-hidden='true'>＋</span><span>{name}</span></Link><nav aria-label='Primary' className='project-grid-nav'>{links.map(link => <Link key={`${link.title}-${link.url}`} href={link.url || '#'}>{link.title}</Link>)}</nav><Link className='project-grid-call' href='/contact'>Start a project <span aria-hidden='true'>↗</span></Link></div></header>
}
