import React from 'react'
import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { resolveAuthSkin } from '@/components/auth/themes/resolve'

/**
 * Auth layout: resolve Site by X-Workspace-ID or request host (same as storefront),
 * so login/register show the correct site name and branding. When the active
 * skin provides a Layout, wrap children in it; otherwise leave bare so each
 * auth page renders its own form shell.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  const skin = await resolveAuthSkin()
  const SkinLayout = skin?.Layout

  return (
    <StorefrontConfigProvider initialConfig={config}>
      {SkinLayout ? <SkinLayout>{children}</SkinLayout> : children}
    </StorefrontConfigProvider>
  )
}
