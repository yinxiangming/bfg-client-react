import CategoryIndexPage from '@views/storefront/CategoryIndexPage'

export const dynamic = 'force-dynamic'

/** Stable category index. An empty category response is still a valid storefront state. */
export default function CategoryPage() {
  return <CategoryIndexPage />
}
