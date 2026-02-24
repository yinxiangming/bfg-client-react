'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import WebsiteHeader from './Header'
import WebsiteFooter from './Footer'
import './website-theme-blocks.css'

function useMaterialSymbols() {
  useEffect(() => {
    if (document.querySelector('link[href*="material-symbols"]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@24,400,0'
    link.setAttribute('crossorigin', 'anonymous')
    document.head.appendChild(link)
  }, [])
}

function useIsDark() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const check = () => setIsDark(el.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  useMaterialSymbols()
  const isDark = useIsDark()
  const pathname = usePathname()
  const isAccountPage = pathname?.startsWith('/account') || false
  const isAdminPage = pathname?.startsWith('/admin') || false
  const isAuthPage = pathname?.startsWith('/auth/') || false

  if (isAccountPage || isAdminPage || isAuthPage) {
    return (
      <div className='flex flex-col min-bs-screen'>
        <main className='flex-1'>{children}</main>
      </div>
    )
  }

  return (
    <StorefrontConfigProvider>
      <div
        className={`website-theme-root flex min-h-screen flex-col ${isDark ? 'dark bg-slate-950' : 'bg-white'}`}
        data-theme='website'
      >
        <WebsiteHeader mode={isDark ? 'dark' : 'light'} />
        <main className={`flex-1 pt-20 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>{children}</main>
        <WebsiteFooter mode={isDark ? 'dark' : 'light'} />
      </div>
    </StorefrontConfigProvider>
  )
}
