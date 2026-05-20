import 'server-only'

import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { ACCOUNT_SKIN_REGISTRY, type AreaSkin } from './registry.generated'

export type AccountSkin = AreaSkin

/**
 * Resolve the active account skin from the request context.
 *
 * Skin id matches the storefront `config.theme` value. When a folder
 * `src/components/account/themes/<theme>/` exists, that skin is applied.
 * Otherwise this returns null and callers fall back to the baseline
 * (current MUI account layout / per-page view component).
 */
export async function resolveAccountSkin(): Promise<AccountSkin | null> {
  const locale = await getLocale()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  const id = config?.theme
  if (!id) return null
  return ACCOUNT_SKIN_REGISTRY[id] ?? null
}

/** Resolve a skin override component for `routeKey`, or null. */
export async function resolveAccountPage(routeKey: string) {
  const skin = await resolveAccountSkin()
  return skin?.pages?.[routeKey] ?? null
}
