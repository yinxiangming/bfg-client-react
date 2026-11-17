export const CATEGORY_PAGE_SIZE = 12

export const CATEGORY_PRICE_RANGES = {
  '0-50': { label: '$0 - $50', min_price: 0, max_price: 50 },
  '50-100': { label: '$50 - $100', min_price: 50, max_price: 100 },
  '100-plus': { label: '$100+', min_price: 100 }
} as const

export type CategoryPriceRange = keyof typeof CATEGORY_PRICE_RANGES

const apiSorts = {
  relevance: undefined,
  sales: 'sales',
  'name-asc': 'name',
  'name-desc': 'name',
  'price-asc': 'price_asc',
  'price-desc': 'price_desc'
} as const

export type CategorySort = keyof typeof apiSorts

type CategoryQueryValue = string | string[] | undefined

type CategoryQuery = {
  page: number
  price: CategoryPriceRange | null
  sort: CategorySort
}

const first = (value: CategoryQueryValue) => Array.isArray(value) ? value[0] : value

export function parseCategoryQuery(params: Record<string, CategoryQueryValue>): CategoryQuery {
  const rawPage = first(params.page)
  const page = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1
  const price = first(params.price)
  const sort = first(params.sort)

  return {
    page: Number.isSafeInteger(page) && page > 1 ? page : 1,
    price: price && Object.hasOwn(CATEGORY_PRICE_RANGES, price) ? price as CategoryPriceRange : null,
    sort: sort && Object.hasOwn(apiSorts, sort) ? sort as CategorySort : 'relevance'
  }
}

export function categoryCatalogueHref(slug: string, { page, price, sort }: CategoryQuery): string {
  const params = new URLSearchParams()
  if (price) params.set('price', price)
  if (sort !== 'relevance') params.set('sort', sort)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()

  return `/category/${encodeURIComponent(slug)}${query ? `?${query}` : ''}`
}

export function categoryProductFilters(price: CategoryPriceRange | null, sort: CategorySort) {
  const bounds: { min_price?: number; max_price?: number } = price ? CATEGORY_PRICE_RANGES[price] : {}
  return { min_price: bounds.min_price, max_price: bounds.max_price, sort: apiSorts[sort] }
}
