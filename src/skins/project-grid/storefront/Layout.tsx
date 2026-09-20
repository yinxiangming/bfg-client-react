'use client'

import React, { useEffect } from 'react'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import { useTheme } from '@/contexts/ThemeContext'
import ProjectGridHeader from './Header'
import ProjectGridFooter from './Footer'
import './project-grid.css'

export default function ProjectGridLayout({ children }: { children: React.ReactNode }) {
  const { forceMode } = useTheme()
  useEffect(() => { forceMode('light'); return () => forceMode(null) }, [forceMode])
  return <StorefrontConfigProvider><div className='project-grid-root' data-theme='project-grid'><ProjectGridHeader /><main>{children}</main><ProjectGridFooter /></div></StorefrontConfigProvider>
}
