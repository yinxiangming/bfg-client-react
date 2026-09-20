'use client'

import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { isStorefrontAcceptingOrders } from '@/utils/storefrontConfig'

/**
 * Whether this shop is taking orders, for the controls that start one.
 *
 * One hook behind every such control — add to cart, go to checkout, place the order —
 * so a shop cannot end up half closed, offering a basket it will not sell from. The
 * answer is the storefront config's, which every storefront, account and auth route
 * is already inside, so no route has to pass it down.
 */
export function useStorefrontOrdering(): { acceptingOrders: boolean } {
  const config = useStorefrontConfigSafe()

  return { acceptingOrders: isStorefrontAcceptingOrders(config) }
}
