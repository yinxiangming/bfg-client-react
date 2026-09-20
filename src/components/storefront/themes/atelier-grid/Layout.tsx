'use client'

import React, { useEffect } from 'react'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import { useTheme } from '@/contexts/ThemeContext'
import AtelierGridHeader from './Header'
import AtelierGridFooter from './Footer'
import './atelier-grid.css'

export default function AtelierGridLayout({ children }: { children: React.ReactNode }) {
  const { forceMode } = useTheme()
  useEffect(() => {
    forceMode('light')
    return () => forceMode(null)
  }, [forceMode])
  return (
    <StorefrontConfigProvider>
      <div className='atelier-grid-root' data-theme='atelier-grid'>
        <AtelierGridHeader />
        <main>{children}</main>
        <AtelierGridFooter />
      </div>
    </StorefrontConfigProvider>
  )
}
