'use client'

import { useStorefrontConfig } from '@/contexts/StorefrontConfigContext'
import './website-auth.css'

type Props = {
  children: React.ReactNode
}

/** Auth shell — left brand panel + right form pane. Pages render their form
 *  inside the children slot; they may opt to use `.au-form-card` for the
 *  matched visual or render their own freeform content. */
export default function WebsiteAuthLayout({ children }: Props) {
  const { config } = useStorefrontConfig()
  const name = (config?.site_name || '').trim() || 'Welcome'
  const initial = name.charAt(0).toUpperCase()
  const tagline = (config?.site_description || '').trim() || 'A modern shopping experience.'

  return (
    <div className='website-auth-root'>
      <aside className='au-hero'>
        <div className='au-hero-brand'>
          <span className='au-hero-brand-mark'>{initial}</span>
          <span>{name}</span>
        </div>
        <div>
          <h1 className='au-hero-headline'>Build trust with every visit.</h1>
          <p className='au-hero-sub'>{tagline}</p>
          <ul className='au-hero-bullets'>
            <li className='au-hero-bullet'>
              <i className='tabler-check' /> Sign in with email or single sign-on
            </li>
            <li className='au-hero-bullet'>
              <i className='tabler-check' /> Track orders, shipments, and payouts in one place
            </li>
            <li className='au-hero-bullet'>
              <i className='tabler-check' /> Manage addresses and saved payment methods
            </li>
          </ul>
        </div>
        <div className='au-hero-foot'>© {new Date().getFullYear()} {name}</div>
      </aside>
      <section className='au-form-pane'>{children}</section>
    </div>
  )
}
