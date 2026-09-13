'use client'

import { useMemo, type ReactNode } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { AppLayoutProvider } from '@/contexts/LayoutSettingsContext'
import { ExtensionLoaderProvider, useExtensions } from '@/extensions/context'
import { isExtensionEnabled } from '@/extensions/availability'
import { applyNavExtensions } from '@/extensions/utils/applyNavExtensions'
import D365StyleLayout from '@/components/admin/layout/D365StyleLayout'
import type { MenuNode } from '@/types/menu'
import { StaffMemberProvider, useStaffMemberContext } from '@/contexts/StaffMemberContext'
import AdminAccessGuard from '@/components/admin/AdminAccessGuard'
import { AdminSkinProvider } from '@/contexts/AdminSkinContext'

type Props = {
  navItems: MenuNode[]
  extensionIds: string[]
  children: React.ReactNode
}

/**
 * Loads only the plugins switched on for this workspace. The admin keeps its token in
 * the browser, so the server layout cannot tell which workspace is signed in; the answer
 * comes from /api/v1/me/, and until it arrives no plugin is loaded.
 */
function EnabledExtensionsLoader({ extensionIds, children }: { extensionIds: string[]; children: ReactNode }) {
  const { extensions, loading } = useStaffMemberContext()
  const enabledIds = useMemo(
    () => (loading ? [] : extensionIds.filter((id) => isExtensionEnabled(id, extensions))),
    [extensionIds, extensions, loading]
  )

  return <ExtensionLoaderProvider extensionIds={enabledIds}>{children}</ExtensionLoaderProvider>
}

function ExtensionDisabledNotice() {
  const t = useTranslations('admin.extensionDisabled')

  return (
    <Box sx={{ py: 10, px: 4, textAlign: 'center' }}>
      <Typography variant='h5' gutterBottom>
        {t('title')}
      </Typography>
      <Typography color='text.secondary' sx={{ mb: 4 }}>
        {t('body')}
      </Typography>
      <Button component={NextLink} href='/admin' variant='contained'>
        {t('back')}
      </Button>
    </Box>
  )
}

/**
 * Applies the loaded plugins' nav entries, including hides and replacements, to the base
 * nav, and keeps a switched-off plugin's own pages (`/admin/<plugin id>/…`) from rendering.
 */
function AdminShell({
  baseNavItems,
  extensionIds,
  children
}: {
  baseNavItems: MenuNode[]
  extensionIds: string[]
  children: ReactNode
}) {
  const pathname = usePathname()
  const { extensions } = useStaffMemberContext()
  const loaded = useExtensions()?.extensions
  const navItems = useMemo(
    () => applyNavExtensions(baseNavItems, (loaded ?? []).flatMap((extension) => extension.adminNav || []), 100),
    [baseNavItems, loaded]
  )

  const pluginSegment = pathname?.split('/')[2] ?? ''
  const onDisabledPluginPage =
    extensionIds.includes(pluginSegment) && !isExtensionEnabled(pluginSegment, extensions)

  return (
    <D365StyleLayout navItems={navItems}>{onDisabledPluginPage ? <ExtensionDisabledNotice /> : children}</D365StyleLayout>
  )
}

export default function AdminLayoutClient({ navItems, extensionIds, children }: Props) {
  return (
    <StaffMemberProvider>
      <AdminAccessGuard>
        <EnabledExtensionsLoader extensionIds={extensionIds}>
          <AppLayoutProvider configCookie={null}>
            <AdminSkinProvider>
              <AdminShell baseNavItems={navItems} extensionIds={extensionIds}>
                {children}
              </AdminShell>
            </AdminSkinProvider>
          </AppLayoutProvider>
        </EnabledExtensionsLoader>
      </AdminAccessGuard>
    </StaffMemberProvider>
  )
}
