'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AppLayoutProvider } from '@/contexts/LayoutSettingsContext'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import { AccountProvider } from '@/contexts/AccountContext'
import AccountShell from '@/components/account/AccountShell'
import AccountSurface from '@/components/account/AccountSurface'
import SiteAnnouncementBanner from '@/components/storefront/SiteAnnouncementBanner'
import { authApi } from '@/utils/authApi'
import { ExtensionLoaderProvider } from '@/extensions/context'
import type { MenuNode } from '@/types/menu'

type AccountLayoutClientProps = {
  children: React.ReactNode
  navItems: MenuNode[]
  extensionIds: string[]
}

export default function AccountLayoutClient({ children, navItems, extensionIds }: AccountLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      const redirect = encodeURIComponent(pathname || '/account')
      router.push(`/?redirect=${redirect}`)
    }
  }, [router, pathname])

  return (
    <ExtensionLoaderProvider extensionIds={extensionIds}>
      <StorefrontConfigProvider>
        <AccountSurface />
        <SiteAnnouncementBanner />
        <AppLayoutProvider configCookie={null}>
          <AccountProvider>
            <AccountShell navItems={navItems}>{children}</AccountShell>
          </AccountProvider>
        </AppLayoutProvider>
      </StorefrontConfigProvider>
    </ExtensionLoaderProvider>
  )
}
