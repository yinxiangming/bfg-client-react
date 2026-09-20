import 'server-only'

import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { AUTH_SKIN_REGISTRY, type AreaSkin } from './registry.generated'

export type AuthSkin = AreaSkin

/**
 * Resolve the active auth skin from the request context. See
 * `components/account/themes/resolve.ts` for the matching contract.
 */
export async function resolveAuthSkin(): Promise<AuthSkin | null> {
  const locale = await getLocale()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  const id = config?.theme
  if (!id) return null
  return AUTH_SKIN_REGISTRY[id] ?? null
}

export async function resolveAuthPage(routeKey: string) {
  const skin = await resolveAuthSkin()
  return skin?.pages?.[routeKey] ?? null
}
