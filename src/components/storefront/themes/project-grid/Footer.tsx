'use client'

import Link from 'next/link'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function ProjectGridFooter() {
  const config = useStorefrontConfigSafe()
  return <footer className='project-grid-footer'><div className='project-grid-footer-inner'><div><Link href='/' className='project-grid-footer-brand'>{config?.site_name?.trim() || 'Project studio'}</Link><p>{config?.site_description || 'A practical showcase for engineering, fabrication, installation, and project delivery.'}</p></div><div className='project-grid-footer-links'><Link href='/projects'>Projects</Link><Link href='/services'>Services</Link><Link href='/products'>Products</Link><Link href='/contact'>Contact</Link></div></div></footer>
}
