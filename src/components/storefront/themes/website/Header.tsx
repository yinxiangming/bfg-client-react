'use client'

import React from 'react'
import Link from 'next/link'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import type { StorefrontMenuItem } from '@/utils/storefrontConfig'

type Props = { mode?: 'light' | 'dark' }

const BRAND_FALLBACK = 'XMart'

/**
 * Header content from CMS (config.header_menus). Styles from website-theme-blocks.css.
 */
export default function WebsiteHeader({ mode = 'light' }: Props) {
  const config = useStorefrontConfigSafe()
  const menus = (config?.header_menus ?? []) as StorefrontMenuItem[]
  const brandName = config?.site_name || BRAND_FALLBACK

  const loginUrl = '/auth/login'
  const demoUrl = '#demo'
  const navItems = menus.filter(
    (item) => item.url !== loginUrl && item.url !== demoUrl && !item.url?.endsWith(demoUrl),
  )
  const loginItem = menus.find((item) => item.url === loginUrl || item.url?.startsWith(loginUrl))
  const demoItem = menus.find((item) => item.url === demoUrl || item.url?.endsWith(demoUrl))

  return (
    <nav className="website-header fixed w-full z-50 glass-panel border-b" data-mode={mode}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2">
            <div className="website-header-logo w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              X
            </div>
            <span className="website-header-brand font-bold text-2xl tracking-tight">{brandName}</span>
          </Link>
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.title}
                href={item.url || '#'}
                className="website-nav-link font-medium transition-colors"
                target={item.open_in_new_tab ? '_blank' : undefined}
                rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
              >
                {item.title}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {loginItem && (
              <Link
                href={loginItem.url || '#'}
                className="website-header-cta website-header-cta-secondary px-5 py-2.5 rounded-full font-medium transition-all hidden md:inline-block"
                target={loginItem.open_in_new_tab ? '_blank' : undefined}
              >
                {loginItem.title}
              </Link>
            )}
            {demoItem && (
              <Link
                href={demoItem.url || '#demo'}
                className="website-header-cta px-5 py-2.5 rounded-full font-bold transition-all"
                target={demoItem.open_in_new_tab ? '_blank' : undefined}
              >
                {demoItem.title}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
