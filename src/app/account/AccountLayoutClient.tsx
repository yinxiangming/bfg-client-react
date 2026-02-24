'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AppLayoutProvider } from '@/contexts/LayoutSettingsContext'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import AppLayoutContainer from '@components/layout/LayoutWrapper'
import SideMenuLayout from '@components/layout/SideMenuLayout'
import TopMenuLayout from '@components/layout/HorizontalLayout'
import SiteAnnouncementBanner from '@/components/storefront/SiteAnnouncementBanner'
import { authApi } from '@/utils/authApi'
import type { MenuNode } from '@/types/menu'

type AccountLayoutClientProps = {
  children: React.ReactNode
  navItems: MenuNode[]
}

export default function AccountLayoutClient({ children, navItems }: AccountLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      const redirect = encodeURIComponent(pathname || '/account')
      router.push(`/?redirect=${redirect}`)
    }
  }, [router, pathname])

  return (
    <StorefrontConfigProvider>
      <SiteAnnouncementBanner />
      <AppLayoutProvider configCookie={null}>
        <AppLayoutContainer
          sideMenuLayout={<SideMenuLayout navItems={navItems}>{children}</SideMenuLayout>}
          topMenuLayout={<TopMenuLayout>{children}</TopMenuLayout>}
        />
      </AppLayoutProvider>
    </StorefrontConfigProvider>
  )
}
