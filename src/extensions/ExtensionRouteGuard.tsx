import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { isExtensionEnabled } from '@/extensions/availability'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'

/**
 * Renders a plugin's storefront or account pages only while the workspace has the plugin's
 * extension switched on; otherwise the route answers 404, as if the plugin were not installed.
 *
 * scripts/prepare.js wraps each plugin's own route folder in this. The storefront config is
 * the one the surrounding layout already fetched for this request, so no extra request is made.
 */
export default async function ExtensionRouteGuard({ id, children }: { id: string; children: ReactNode }) {
  const locale = await getLocale()
  const requestHost = (await headers()).get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  if (!isExtensionEnabled(id, config?.extensions)) notFound()
  return <>{children}</>
}
