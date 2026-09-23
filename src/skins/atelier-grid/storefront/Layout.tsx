'use client'

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import AtelierGridHeader from './Header'
import AtelierGridFooter from './Footer'
import './atelier-grid.css'
import './pages/cms.css'
import './design.css'

export default function AtelierGridLayout({ children }: { children: React.ReactNode }) {
  const { forceMode } = useTheme()
  const pathname = usePathname()
  useEffect(() => {
    forceMode('light')
    return () => forceMode(null)
  }, [forceMode])
  return (
    <div className='atelier-grid-root' data-theme='atelier-grid' data-inner-page={pathname !== '/'}>
      <AtelierGridHeader />
      <main key={pathname} className='atelier-grid-page-transition'>{children}</main>
      <AtelierGridFooter />
    </div>
  )
}
