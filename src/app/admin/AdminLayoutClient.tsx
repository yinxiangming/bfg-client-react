'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AppLayoutProvider } from '@/contexts/LayoutSettingsContext'
import { ExtensionLoaderProvider } from '@/extensions/context'
import D365StyleLayout from '@/components/admin/layout/D365StyleLayout'
import type { MenuNode } from '@/types/menu'
import { authApi } from '@/utils/authApi'

type Props = {
  navItems: MenuNode[]
  extensionIds: string[]
  children: React.ReactNode
}

export default function AdminLayoutClient({ navItems, extensionIds, children }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      const redirect = pathname || '/admin'
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`)
    }
  }, [router, pathname])

  return (
    <ExtensionLoaderProvider extensionIds={extensionIds}>
      <AppLayoutProvider configCookie={null}>
        <D365StyleLayout navItems={navItems}>
          {children}
        </D365StyleLayout>
      </AppLayoutProvider>
    </ExtensionLoaderProvider>
  )
}
