import SearchPage from '@views/storefront/SearchPage'

export const dynamic = 'force-dynamic'

/** Stable all-products entry point. Empty inventory is rendered by SearchPage, not as a 404. */
export default function ShopPage() {
  return <SearchPage />
}
