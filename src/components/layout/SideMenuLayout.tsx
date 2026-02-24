'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

// Component Imports
import Sidebar from '@components/layout/Sidebar'
import Topbar from '@components/layout/Topbar'
import Footer from '@components/layout/Footer'

// Data Imports
import { defaultNavItems } from '@/data/navItems'

// Type Imports
import type { MenuNode } from '@/types/menu'

// Config Imports
import { layoutVariants, layoutConfig } from '@configs/layoutConfig'

type SideMenuLayoutProps = {
  children: React.ReactNode
  navItems?: MenuNode[]
}

const SidebarComponent = layoutVariants.sidebar[layoutConfig.sidebarVariant] || layoutVariants.sidebar.default
const FooterComponent = layoutVariants.footer[layoutConfig.footerVariant] || layoutVariants.footer.default

const SideMenuLayout = ({ children, navItems = defaultNavItems }: SideMenuLayoutProps) => {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      if (typeof window === 'undefined') return
      setIsMobile(window.innerWidth <= 960)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  useEffect(() => {
    // close mobile menu on route change
    setMobileOpen(false)
  }, [pathname])

  const handleToggleCollapse = () => {
    if (isMobile) {
      setMobileOpen(prev => !prev)
    } else {
      setCollapsed(prev => !prev)
    }
  }

  const handleOverlayClick = () => setMobileOpen(false)

  return (
    <div className={`admin-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <SidebarComponent
        navItems={navItems}
        activePath={pathname}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
      />
      {isMobile && mobileOpen && <div className='sidebar-overlay' onClick={handleOverlayClick} />}
      <div className='admin-main'>
        <div className='admin-content'>
          <Topbar onMenuToggle={handleToggleCollapse} showMenuToggle={isMobile} />
          <div className='admin-content-body'>
            {children}
          </div>
          <FooterComponent />
        </div>
      </div>
    </div>
  )
}

export default SideMenuLayout

