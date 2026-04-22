// Store API service (BFG2 Shop module)

import { apiFetch, bfgApi, buildApiUrl, API_VERSIONS } from '@/utils/api'
import { getSiteAdminOptions } from '@/services/settings'
import type { FormSchema } from '@/types/schema'

export interface ProductVariant {
  id: number
  product: number
  name: string
  sku?: string
  options?: Record<string, any>
  price: number
  compare_price?: number
  stock_quantity: number
  available?: boolean
  weight?: number
  is_active: boolean
  order?: number
}

export interface ProductMedia {
  id: number
  product: number
  variant?: number | null
  file: string  // Backend uses 'file' field
  media_type: string
  alt_text?: string
  position: number
  is_product_image?: boolean
  created_at?: string
  media?: {
    id: number
    file: string
    media_type: string
    alt_text?: string
  }
}

export interface ProductMediaListResponse {
  items: ProductMedia[]
  total: number
  next?: string | null
  previous?: string | null
}

/**
 * Variants API
 */
export async function getProductVariants(productId: number): Promise<ProductVariant[]> {
  const response = await apiFetch<{ results?: ProductVariant[]; data?: ProductVariant[] }>(`${bfgApi.variants()}?product=${productId}`, getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function createProductVariant(data: Partial<ProductVariant>): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(bfgApi.variants(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateProductVariant(id: number, data: Partial<ProductVariant>): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`${bfgApi.variants()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteProductVariant(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.variants()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Variant Inventory API
export interface VariantInventory {
  id?: number
  variant: number
  warehouse: number
  quantity: number
  reserved?: number
}

export async function getVariantInventories(productId: number): Promise<VariantInventory[]> {
  const response = await apiFetch<VariantInventory[] | { results?: VariantInventory[] }>(
    `${bfgApi.products()}${productId}/inventory/`,
    getSiteAdminOptions()
  )
  if (Array.isArray(response)) {
    return response
  }
  return response.results || []
}

export async function updateVariantInventories(productId: number, inventories: VariantInventory[]): Promise<void> {
  return apiFetch<void>(`${bfgApi.products()}${productId}/inventory/`, {
    ...getSiteAdminOptions(),
    method: 'PUT',
    body: JSON.stringify({ inventories })
  })
}

export interface Store {
  id: number
  name: string
  code?: string
  description?: string
  address?: string
  warehouses?: { id: number; name: string }[]
  settings?: Record<string, any>
  is_active: boolean
  workspace?: number
  created_at: string
  updated_at?: string
}

export interface StorePayload {
  name: string
  code?: string
  description?: string
  address?: string
  warehouses?: number[]
  settings?: Record<string, any>
  is_active: boolean
}

export interface SalesChannel {
  id: number
  name: string
  code: string
  channel_type: 'online_store' | 'pos' | 'mobile_app' | 'social' | 'marketplace' | 'custom'
  description?: string
  config?: Record<string, any>
  is_active: boolean
  is_default: boolean
  workspace?: number
  created_at: string
  updated_at?: string
}

export interface SalesChannelPayload {
  name: string
  code: string
  channel_type: 'online_store' | 'pos' | 'mobile_app' | 'social' | 'marketplace' | 'custom'
  description?: string
  config?: Record<string, any>
  is_active: boolean
  is_default: boolean
}

export interface SubscriptionPlan {
  id: number
  name: string
  description?: string
  price: number
  interval: 'day' | 'week' | 'month' | 'year'
  interval_count: number
  trial_period_days: number
  features: string[]
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface SubscriptionPlanPayload {
  name: string
  description?: string
  price: number
  interval: 'day' | 'week' | 'month' | 'year'
  interval_count: number
  trial_period_days: number
  features: string[]
  is_active: boolean
}

export interface Warehouse {
  id: number
  name: string
  code?: string
  address?: string
  is_active?: boolean
}

// Stores API
export async function getStores(): Promise<Store[]> {
  const response = await apiFetch<Store[] | { results: Store[]; data?: Store[] }>(bfgApi.stores(), getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getStore(id: number): Promise<Store> {
  return apiFetch<Store>(`${bfgApi.stores()}${id}/`, getSiteAdminOptions())
}

export async function createStore(data: StorePayload): Promise<Store> {
  const { warehouses, ...rest } = data
  return apiFetch<Store>(bfgApi.stores(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({
      ...rest,
      ...(Array.isArray(warehouses) ? { warehouse_ids: warehouses } : {})
    })
  })
}

export async function updateStore(id: number, data: Partial<StorePayload>): Promise<Store> {
  const { warehouses, ...rest } = data
  return apiFetch<Store>(`${bfgApi.stores()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify({
      ...rest,
      ...(Array.isArray(warehouses) ? { warehouse_ids: warehouses } : {})
    })
  })
}

export async function deleteStore(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.stores()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Sales Channels API
export async function getSalesChannels(): Promise<SalesChannel[]> {
  const response = await apiFetch<SalesChannel[] | { results: SalesChannel[]; data?: SalesChannel[] }>(bfgApi.salesChannels(), getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getSalesChannel(id: number): Promise<SalesChannel> {
  return apiFetch<SalesChannel>(`${bfgApi.salesChannels()}${id}/`, getSiteAdminOptions())
}

export async function createSalesChannel(data: SalesChannelPayload): Promise<SalesChannel> {
  return apiFetch<SalesChannel>(bfgApi.salesChannels(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateSalesChannel(id: number, data: Partial<SalesChannelPayload>): Promise<SalesChannel> {
  return apiFetch<SalesChannel>(`${bfgApi.salesChannels()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteSalesChannel(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.salesChannels()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Subscription Plans API
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiFetch<SubscriptionPlan[] | { results: SubscriptionPlan[]; data?: SubscriptionPlan[] }>(bfgApi.subscriptionPlans(), getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getSubscriptionPlan(id: number): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(`${bfgApi.subscriptionPlans()}${id}/`, getSiteAdminOptions())
}

export async function createSubscriptionPlan(data: SubscriptionPlanPayload): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(bfgApi.subscriptionPlans(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlanPayload>): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(`${bfgApi.subscriptionPlans()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteSubscriptionPlan(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.subscriptionPlans()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

// Warehouses API (for dropdowns)
export async function getWarehouses(): Promise<Warehouse[]> {
  const response = await apiFetch<Warehouse[] | { results: Warehouse[] }>(bfgApi.warehouses(), getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || []
}

// Order types and API
export interface OrderItemSummary {
  product_name: string
  quantity: number
}

export interface Order {
  id: number
  order_number: string
  customer?: number | string
  customer_name?: string
  store?: number | string
  store_name?: string
  fulfillment_method?: 'shipping' | 'pickup'
  total: number
  item_count?: number
  /** Brief item list for list view (product_name, quantity) */
  items?: OrderItemSummary[]
  customer_note?: string
  /** Number of packages for logistics column */
  packages_count?: number
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed'
  created_at: string
}

export type OrderListParams = {
  status?: string
  payment_status?: string
  store?: string
  created_after?: string
  created_before?: string
}

export async function getOrders(params?: OrderListParams): Promise<Order[]> {
  let url = bfgApi.orders().replace(/\/+$/, '')
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') qs.set(k, v)
    })
    if (qs.toString()) url += `?${qs.toString()}`
  }
  const response = await apiFetch<Order[] | { results: Order[]; data?: Order[] }>(url, getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getOrder(id: number): Promise<Order> {
  return apiFetch<Order>(`${bfgApi.orders()}${id}/`, getSiteAdminOptions())
}

/** Payload for staff direct order creation (backend OrderCreateSerializer) */
export interface CreateOrderPayload {
  customer_id: number
  store_id: number
  fulfillment_method?: 'shipping' | 'pickup'
  shipping_address_id?: number | null
  billing_address_id?: number | null
  status?: Order['status']
  payment_status?: Order['payment_status']
  customer_note?: string
  admin_note?: string
}

export async function createOrder(data: CreateOrderPayload): Promise<Order> {
  return apiFetch<Order>(bfgApi.orders(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function cancelOrder(id: number, reason?: string): Promise<Order> {
  return apiFetch<Order>(`${bfgApi.orders()}${id}/cancel/`, {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {})
  })
}

export async function refundOrder(id: number): Promise<Order> {
  return apiFetch<Order>(`${bfgApi.orders()}${id}/refund/`, {
    ...getSiteAdminOptions(),
    method: 'POST'
  })
}

export interface ReturnRequest {
  id: number
  order: number
  customer: number
  return_number: string
  status: 'open' | 'approved' | 'rejected' | 'received' | 'inspected' | 'refunded' | 'closed' | 'cancelled'
  reason_category?: string
  customer_note?: string
  admin_note?: string
  created_at?: string
}

export interface ReturnLineItemPayload {
  order_item: number
  quantity: number
  reason?: string
  restock_action?: 'no_restock' | 'restock' | 'damage'
}

const returnsApi = () => buildApiUrl('/returns/', API_VERSIONS.BFG2)
const returnItemsApi = () => buildApiUrl('/return-items/', API_VERSIONS.BFG2)

export async function createReturnRequest(data: {
  order: number
  reason_category?: string
  customer_note?: string
  admin_note?: string
}): Promise<ReturnRequest> {
  return apiFetch<ReturnRequest>(returnsApi(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function createReturnLineItem(returnId: number, data: ReturnLineItemPayload): Promise<any> {
  return apiFetch<any>(returnItemsApi(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({ ...data, return_request: returnId })
  })
}

export async function processReturnRefund(returnId: number): Promise<ReturnRequest> {
  return apiFetch<ReturnRequest>(`${returnsApi()}${returnId}/process_refund/`, {
    ...getSiteAdminOptions(),
    method: 'POST'
  })
}

export async function relistResaleByOrder(orderId: number): Promise<{ count: number; results: any[] }> {
  return apiFetch<{ count: number; results: any[] }>(buildApiUrl('/resale/products/relist-by-order/', API_VERSIONS.BFG2), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({ order_id: orderId })
  })
}

export async function updateOrder(id: number, data: Partial<Order>): Promise<Order> {
  return apiFetch<Order>(`${bfgApi.orders()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

/** Item payload for update_order_items (product + optional variant + quantity) */
export interface OrderItemUpdatePayload {
  product: number
  variant?: number
  quantity: number
}

export async function updateOrderItems(orderId: number, items: OrderItemUpdatePayload[]): Promise<Order> {
  return apiFetch<Order>(`${bfgApi.orders()}${orderId}/update_items/`, {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({ items })
  })
}

export async function deleteOrder(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.orders()}${id}/`, { ...getSiteAdminOptions(), method: 'DELETE' })
}

// Product reviews (admin)
export interface ProductReview {
  id: number
  product: number
  product_name?: string
  customer: number
  customer_name?: string
  rating: number
  title?: string
  comment?: string
  images?: string[]
  is_verified_purchase?: boolean
  is_approved?: boolean
  helpful_count?: number
  created_at: string
  updated_at?: string
}

export interface GetReviewsParams {
  product?: number | string
  is_approved?: string
}

export async function getReviews(params?: GetReviewsParams): Promise<ProductReview[]> {
  const q = new URLSearchParams()
  if (params?.product != null) q.set('product', String(params.product))
  if (params?.is_approved != null && params.is_approved !== '') q.set('is_approved', params.is_approved)
  const url = q.toString() ? `${bfgApi.reviews().replace(/\/+$/, '')}?${q}` : bfgApi.reviews()
  const response = await apiFetch<ProductReview[] | { results: ProductReview[]; data?: ProductReview[] }>(url, getSiteAdminOptions())
  if (Array.isArray(response)) return response
  return response.results || response.data || []
}

export async function approveReview(id: number): Promise<ProductReview> {
  return apiFetch<ProductReview>(`${bfgApi.reviews()}${id}/approve/`, { ...getSiteAdminOptions(), method: 'POST' })
}

export async function rejectReview(id: number): Promise<ProductReview> {
  return apiFetch<ProductReview>(`${bfgApi.reviews()}${id}/reject/`, { ...getSiteAdminOptions(), method: 'POST' })
}

export async function deleteReview(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.reviews()}${id}/`, { ...getSiteAdminOptions(), method: 'DELETE' })
}

export interface DashboardStats {
  orders_today: number
  revenue_today: number
  customers_count: number
  orders_last_7_days: number[]
  categories: string[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const base = bfgApi.orders().replace(/\/+$/, '')
  return apiFetch<DashboardStats>(`${base}/dashboard-stats/`, getSiteAdminOptions())
}

// Customer types and API
export interface Customer {
  id: number
  customer_number?: string
  company_name?: string
  tax_number?: string
  user_email?: string
  user?: {
    id: number
    email: string
    first_name?: string
    last_name?: string
    phone?: string
    language?: string
  }
  user_id?: number
  workspace?: number | string
  credit_limit?: number
  balance?: number
  is_active?: boolean
  is_verified?: boolean
  verified_at?: string | null
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface GetCustomersParams {
  /** Search by name, email, or phone (DRF SearchFilter) */
  search?: string
}

export async function getCustomers(params?: GetCustomersParams): Promise<Customer[]> {
  const q = new URLSearchParams()
  if (params?.search?.trim()) q.set('search', params.search.trim())
  const url = q.toString() ? `${bfgApi.customers().replace(/\/+$/, '')}?${q}` : bfgApi.customers()
  const response = await apiFetch<Customer[] | { results: Customer[]; data?: Customer[] }>(url, getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getCustomer(id: number): Promise<Customer> {
  return apiFetch<Customer>(`${bfgApi.customers()}${id}/`, getSiteAdminOptions())
}

// Address types and API
export interface Address {
  id: number
  customer?: number
  full_name?: string
  company?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  phone?: string
  email?: string
  is_default?: boolean
}

export async function getCustomerAddresses(customerId: number): Promise<Address[]> {
  const response = await apiFetch<Address[] | { results: Address[] }>(`${bfgApi.addresses()}?customer=${customerId}`, getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || []
}

export async function createAddress(data: Partial<Address>): Promise<Address> {
  return apiFetch<Address>(bfgApi.addresses(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateAddress(id: number, data: Partial<Address>): Promise<Address> {
  return apiFetch<Address>(`${bfgApi.addresses()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteAddress(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.addresses()}${id}/`, { ...getSiteAdminOptions(), method: 'DELETE' })
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  return apiFetch<Customer>(bfgApi.customers(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
  return apiFetch<Customer>(`${bfgApi.customers()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteCustomer(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.customers()}${id}/`, { ...getSiteAdminOptions(), method: 'DELETE' })
}

// Product types and API
export interface Product {
  id: number
  name: string
  slug?: string
  sku: string
  price: number
  compare_price?: number | null
  cost?: number | null
  category?: number | string
  categories?: Array<number | string>
  tags?: Array<number | string>
  stock?: number
  stock_quantity?: number
  description?: string
  short_description?: string
  product_type?: string
  track_inventory?: boolean
  is_subscription?: boolean
  subscription_plan?: number | string | null
  is_active?: boolean
  is_featured?: boolean
  status?: 'active' | 'inactive'
  condition?: string
  thumbnail?: string
  primary_image?: string | null
  category_names?: string[]
  language?: string
  media?: any[]
  variants?: any[]
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  parent?: number | null
  icon?: string
  image?: string
  order?: number
  is_active?: boolean
  rules?: Array<{ column: string; relation: string; condition: string | number }>
  rule_match_type?: 'all' | 'any'
  language: string
  created_at?: string
  updated_at?: string
  children?: Category[]
  product_count?: number
}

export interface Tag {
  id: number
  name: string
  slug?: string
  created_at?: string
}

export async function getProducts(params?: {
  search?: string
  category?: number
  tag?: number
  featured?: boolean
  page?: number
  page_size?: number
}): Promise<Product[]> {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.append('search', params.search)
  if (params?.category) searchParams.append('category', params.category.toString())
  if (params?.tag) searchParams.append('tag', params.tag.toString())
  if (params?.featured !== undefined) searchParams.append('featured', params.featured.toString())
  if (params?.page) searchParams.append('page', params.page.toString())
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString())

  const url = `${bfgApi.products()}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const response = await apiFetch<Product[] | { results?: Product[]; data?: Product[] }>(url, getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getProduct(id: number): Promise<Product> {
  return apiFetch<Product>(`${bfgApi.products()}${id}/`, getSiteAdminOptions())
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(bfgApi.products(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(`${bfgApi.products()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteProduct(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.products()}${id}/`, { ...getSiteAdminOptions(), method: 'DELETE' })
}

// Wishlist (admin)
export interface WishlistEntry {
  id: number
  workspace: number
  customer: number
  customer_name: string
  product: number
  product_name: string
  created_at: string
}

export async function getWishlists(params?: { customer?: number; product?: number }): Promise<WishlistEntry[]> {
  const q = new URLSearchParams()
  if (params?.customer != null) q.set('customer', String(params.customer))
  if (params?.product != null) q.set('product', String(params.product))
  const url = q.toString() ? `${bfgApi.wishlists().replace(/\/+$/, '')}?${q}` : bfgApi.wishlists()
  const response = await apiFetch<WishlistEntry[] | { results: WishlistEntry[] }>(url, getSiteAdminOptions())
  return Array.isArray(response) ? response : (response.results || [])
}

export async function deleteWishlist(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.wishlists()}${id}/`, { ...getSiteAdminOptions(), method: 'DELETE' })
}

export async function getCategories(lang: string = 'en'): Promise<Category[]> {
  const url = `${bfgApi.products()}categories/?lang=${lang}`
  const response = await apiFetch<Category[] | { results?: Category[]; data?: Category[] }>(url, getSiteAdminOptions())
  let list: Category[] = Array.isArray(response) ? response : (response.results || response.data || [])
  if (list.length === 0 && lang !== 'en') {
    const enUrl = `${bfgApi.products()}categories/?lang=en`
    const enResponse = await apiFetch<Category[] | { results?: Category[]; data?: Category[] }>(enUrl, getSiteAdminOptions())
    list = Array.isArray(enResponse) ? enResponse : (enResponse.results || enResponse.data || [])
  }
  return list
}

export async function getCategoriesTree(lang: string = 'en'): Promise<Category[]> {
  try {
    const url = `${bfgApi.products()}categories/?lang=${lang}&tree=true`
    const response = await apiFetch<Category[] | { results?: Category[]; data?: Category[] }>(url, getSiteAdminOptions())
    let categories: Category[] = Array.isArray(response) ? response : (response.results || response.data || [])
    if (categories.length === 0 && lang !== 'en') {
      const enUrl = `${bfgApi.products()}categories/?lang=en&tree=true`
      const enResponse = await apiFetch<Category[] | { results?: Category[]; data?: Category[] }>(enUrl, getSiteAdminOptions())
      categories = Array.isArray(enResponse) ? enResponse : (enResponse.results || enResponse.data || [])
    }
    return categories
  } catch (error: any) {
    console.error('[getCategoriesTree] Error:', error)
    try {
      const fallbackUrl = `${bfgApi.products()}categories/?lang=${lang}`
      const fallbackResponse = await apiFetch<Category[] | { results?: Category[]; data?: Category[] }>(fallbackUrl, getSiteAdminOptions())
      let list = Array.isArray(fallbackResponse) ? fallbackResponse : (fallbackResponse.results || fallbackResponse.data || [])
      if (list.length === 0 && lang !== 'en') {
        const enFallback = await apiFetch<Category[] | { results?: Category[]; data?: Category[] }>(`${bfgApi.products()}categories/?lang=en`, getSiteAdminOptions())
        list = Array.isArray(enFallback) ? enFallback : (enFallback.results || enFallback.data || [])
      }
      return list
    } catch (fallbackError) {
      console.error('[getCategoriesTree] Fallback also failed:', fallbackError)
      return []
    }
  }
}

export async function getCategory(id: number): Promise<Category> {
  return apiFetch<Category>(`${bfgApi.products()}categories/${id}/`, getSiteAdminOptions())
}

export interface CategoryRulesSchemaResponse {
  form_schema: FormSchema
}

export async function getCategoryRulesSchema(): Promise<FormSchema> {
  const res = await apiFetch<CategoryRulesSchemaResponse>(bfgApi.productCategoryRulesSchema(), getSiteAdminOptions())
  return res.form_schema
}

export type CategoryPayload = Omit<Category, 'id' | 'created_at' | 'updated_at' | 'children' | 'product_count'>

export async function createCategory(data: CategoryPayload): Promise<Category> {
  return apiFetch<Category>(`${bfgApi.products()}categories/`, {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCategory(id: number, data: Partial<CategoryPayload>): Promise<Category> {
  return apiFetch<Category>(`${bfgApi.products()}categories/${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteCategory(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.products()}categories/${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

/**
 * Tags API (from admin)
 */
export async function getTags(lang: string = 'en'): Promise<Tag[]> {
  const url = `${bfgApi.products()}tags/?lang=${lang}`
  const response = await apiFetch<Tag[] | { results?: Tag[]; data?: Tag[] }>(url, getSiteAdminOptions())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

/**
 * Media API
 */
export async function getProductMedia(params: { productId?: number; variantId?: number; search?: string; page?: number; pageSize?: number; dir?: string; folder?: string; isProductImage?: boolean }): Promise<ProductMediaListResponse> {
  const qs = new URLSearchParams()
  if (params.productId) qs.set('product', params.productId.toString())
  if (params.variantId) qs.set('variant', params.variantId.toString())
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', params.page.toString())
  if (params.pageSize) qs.set('page_size', params.pageSize.toString())
  if (params.dir) qs.set('dir', params.dir)
  if (params.folder) qs.set('folder', params.folder)
  if (params.isProductImage !== undefined) qs.set('is_product_image', params.isProductImage.toString())
  const response = await apiFetch<{ results?: ProductMedia[]; data?: ProductMedia[]; count?: number; next?: string | null; previous?: string | null }>(`${bfgApi.productMedia()}?${qs.toString()}`, getSiteAdminOptions())
  if (Array.isArray(response)) {
    return { items: response, total: response.length }
  }
  const items = response.results || response.data || []
  return {
    items,
    total: response.count ?? items.length,
    next: response.next,
    previous: response.previous
  }
}

export async function uploadProductMedia(productId: number, file: File, variantId?: number, folder?: string): Promise<ProductMedia> {
  const formData = new FormData()
  formData.append('product', productId.toString())
  if (variantId) {
    formData.append('variant', variantId.toString())
  }
  if (folder) {
    formData.append('folder', folder)
  }
  formData.append('file', file)  // Backend uses 'file' field, not 'image'

  // Use apiFetch which already handles FormData correctly
  // apiFetch doesn't set Content-Type for FormData, letting browser set it with boundary
  return apiFetch<ProductMedia>(bfgApi.productMedia(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: formData
  })
}

// Folder management APIs
export async function getProductMediaFolders(): Promise<{ folders: string[]; count: number }> {
  return apiFetch<{ folders: string[]; count: number }>(`${bfgApi.productMedia()}folders/`, getSiteAdminOptions())
}

export async function createProductMediaFolder(folder: string): Promise<{ folder: string; message: string }> {
  return apiFetch<{ folder: string; message: string }>(`${bfgApi.productMedia()}create_folder/`, {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({ folder })
  })
}

export async function deleteProductMediaFolder(folder: string): Promise<{ folder: string; deleted_count: number; message: string }> {
  const qs = new URLSearchParams()
  qs.set('folder', folder)
  return apiFetch<{ folder: string; deleted_count: number; message: string }>(`${bfgApi.productMedia()}delete_folder/?${qs.toString()}`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

export async function deleteProductMedia(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.productMedia()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

export async function deleteProductMediaFile(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${bfgApi.productMedia()}${id}/delete_file/`, {
    ...getSiteAdminOptions(),
    method: 'DELETE'
  })
}

export async function updateProductMedia(id: number, data: Partial<ProductMedia>): Promise<ProductMedia> {
  return apiFetch<ProductMedia>(`${bfgApi.productMedia()}${id}/`, {
    ...getSiteAdminOptions(),
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function copyProductMediaToProduct(mediaId: number, targetProductId: number, isProductImage: boolean = true): Promise<ProductMedia> {
  return apiFetch<ProductMedia>(`${bfgApi.productMedia()}${mediaId}/copy_to_product/`, {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({ product_id: targetProductId, is_product_image: isProductImage })
  })
}
