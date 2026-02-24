'use client'

// React Imports
import type { ReactNode } from 'react'

// Component Imports
import TopMenuTopbar from './TopMenuTopbar'
import TopMenuHeader from './TopMenuHeader'
import Footer from './Footer'

// Data Imports
import { defaultNavItems } from '@/data/navItems'

// Type Imports
import type { MenuNode } from '@/types/menu'

// Config Imports
import { layoutVariants } from '@configs/layoutConfig'

type TopMenuLayoutProps = {
  children: ReactNode
  navItems?: MenuNode[]
}

const TopMenuLayout = (props: TopMenuLayoutProps) => {
  // Props
  const { children, navItems = defaultNavItems } = props

  const FooterComponent = layoutVariants.footer.default

  return (
    <div className='app-layout-topmenu flex flex-auto'>
      <div className='app-main-topmenu flex flex-col flex-auto'>
        <header className='topmenu-header'>
          <TopMenuTopbar />
          <TopMenuHeader navItems={navItems} />
        </header>
        <div className='app-content-topmenu flex flex-col flex-1 overflow-hidden'>
          <div className='app-content-body flex-1 overflow-y-auto overflow-x-hidden'>
            {children}
          </div>
          <FooterComponent />
        </div>
      </div>
    </div>
  )
}

export default TopMenuLayout

