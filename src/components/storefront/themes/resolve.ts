import 'server-only'

import { headers } from 'next/headers'
import { getLocale } from 'next-intl/server'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { STOREFRONT_PAGE_OVERRIDES, type StorefrontSkinPage } from './registry.generated'

/**
 * Resolve a storefront page-level override component for `routeKey`.
 * Returns null when the active theme has no override for this route — the
 * caller should fall back to its existing default view.
 *
 * Stable route keys:
 *   home              → /
 *   product/[id]      → /product/[id]
 *   category/[slug]   → /category/[slug]
 *   cart              → /cart
 *   checkout          → /checkout
 *   checkout/success  → /checkout/success
 *   search            → /search
 *   cms               → /[slug]
 */
export async function resolveStorefrontPage(routeKey: string): Promise<StorefrontSkinPage | null> {
  const locale = await getLocale()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  const id = config?.theme
  if (!id) return null
  return STOREFRONT_PAGE_OVERRIDES[id]?.[routeKey] ?? null
}
