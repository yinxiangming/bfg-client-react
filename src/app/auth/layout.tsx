import React from 'react'
import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'

/**
 * Auth layout: resolve Site by X-Workspace-ID or request host (same as storefront),
 * so login/register show the correct site name and branding.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)

  return (
    <StorefrontConfigProvider initialConfig={config}>
      {children}
    </StorefrontConfigProvider>
  )
}
