// Resale plugin API endpoints

import { buildApiUrl, API_VERSIONS } from '@/utils/api'

/**
 * Resale API endpoints
 */
export const resaleApi = {
  settings: () => buildApiUrl('/resale/settings/', API_VERSIONS.BFG2),
  products: () => buildApiUrl('/resale/products/', API_VERSIONS.BFG2),
  payouts: () => buildApiUrl('/resale/payouts/', API_VERSIONS.BFG2),
  customerPreference: (customerId: number) => buildApiUrl(`/resale/preferences/${customerId}/`, API_VERSIONS.BFG2),
  myProducts: () => buildApiUrl('/resale/my/products/', API_VERSIONS.BFG2),
  myPayouts: () => buildApiUrl('/resale/my/payouts/', API_VERSIONS.BFG2),
  myPreference: () => buildApiUrl('/resale/my/preference/', API_VERSIONS.BFG2),
  productOwner: (productId: number) => buildApiUrl(`/resale/product-owner/${productId}/`, API_VERSIONS.BFG2)
}
