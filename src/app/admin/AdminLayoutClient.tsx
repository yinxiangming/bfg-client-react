'use client'

import { AppLayoutProvider } from '@/contexts/LayoutSettingsContext'
import { ExtensionLoaderProvider } from '@/extensions/context'
import D365StyleLayout from '@/components/admin/layout/D365StyleLayout'
import type { MenuNode } from '@/types/menu'
import { StaffMemberProvider } from '@/contexts/StaffMemberContext'
import AdminAccessGuard from '@/components/admin/AdminAccessGuard'
import { AdminSkinProvider } from '@/contexts/AdminSkinContext'

type Props = {
  navItems: MenuNode[]
  extensionIds: string[]
  children: React.ReactNode
}

export default function AdminLayoutClient({ navItems, extensionIds, children }: Props) {
  return (
    <StaffMemberProvider>
      <AdminAccessGuard>
        <ExtensionLoaderProvider extensionIds={extensionIds}>
          <AppLayoutProvider configCookie={null}>
            <AdminSkinProvider>
              <D365StyleLayout navItems={navItems}>
                {children}
              </D365StyleLayout>
            </AdminSkinProvider>
          </AppLayoutProvider>
        </ExtensionLoaderProvider>
      </AdminAccessGuard>
    </StaffMemberProvider>
  )
}
