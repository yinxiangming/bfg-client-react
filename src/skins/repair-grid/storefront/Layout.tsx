'use client'

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import RepairGridHeader from './Header'
import RepairGridFooter from './Footer'
import './repair-grid.css'
import './pages/cms.css'
import './design.css'

export default function RepairGridLayout({ children }: { children: React.ReactNode }) {
  const { forceMode } = useTheme()
  const pathname = usePathname()
  useEffect(() => {
    forceMode('light')
    return () => forceMode(null)
  }, [forceMode])

  return (
    <div className='repair-grid-root' data-theme='repair-grid' data-inner-page={pathname !== '/'}>
      <RepairGridHeader />
      <main key={pathname} className='repair-grid-page-transition'>{children}</main>
      <RepairGridFooter />
    </div>
  )
}
