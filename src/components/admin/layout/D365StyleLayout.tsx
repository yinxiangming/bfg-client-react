'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

// Component Imports
import Sidebar from '@components/layout/Sidebar'
import Topbar from '@components/layout/Topbar'

// Data Imports
import { adminNavItems } from '@/data/adminNavItems'

// Type Imports
import type { MenuNode } from '@/types/menu'

// RBAC Imports
import { useStaffMemberContext } from '@/contexts/StaffMemberContext'
import { filterNavByAccess } from '@/utils/filterNavByAccess'

// Config Imports
import { layoutVariants, layoutConfig } from '@configs/layoutConfig'

type D365StyleLayoutProps = {
  children: React.ReactNode
  navItems?: MenuNode[]
}

const SidebarComponent = layoutVariants.sidebar[layoutConfig.sidebarVariant] || layoutVariants.sidebar.default

const D365StyleLayout = ({ children, navItems = adminNavItems }: D365StyleLayoutProps) => {
  const pathname = usePathname()
  const { staffMember, loading: staffLoading } = useStaffMemberContext()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const visibleNavItems = useMemo(() => {
    if (staffLoading) return [] as MenuNode[]
    return filterNavByAccess(navItems, {
      isAdmin:
        staffMember?.is_active === true && staffMember.role.code === 'admin',
      permissions: staffMember?.is_active ? staffMember.role.permissions : null,
    })
  }, [navItems, staffMember, staffLoading])

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

  return (
    <div className={`d365-admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Main Container */}
      <div className='d365-main-container'>
        {/* Sidebar */}
        <aside className={`d365-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
          <SidebarComponent
            navItems={visibleNavItems}
            activePath={pathname}
            collapsed={collapsed}
            onToggleCollapse={handleToggleCollapse}
            mobileOpen={mobileOpen}
          />
        </aside>
        {/* Main Content Area with Topbar */}
        <div className='d365-content-wrapper'>
          {/* Topbar - Only spans content area */}
          <div className='d365-topbar-wrapper'>
            <Topbar onMenuToggle={handleToggleCollapse} showMenuToggle={true} />
          </div>
          
          {/* Main Content Area - Full Width */}
          <main className='d365-content'>
            <div className='d365-content-body'>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default D365StyleLayout

