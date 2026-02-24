// Store API service (BFG2 Shop module)

import { apiFetch, bfgApi } from '@/utils/api'
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
  const response = await apiFetch<{ results?: ProductVariant[]; data?: ProductVariant[] }>(`${bfgApi.variants()}?product=${productId}`)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function createProductVariant(data: Partial<ProductVariant>): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(bfgApi.variants(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateProductVariant(id: number, data: Partial<ProductVariant>): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`${bfgApi.variants()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteProductVariant(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.variants()}${id}/`, {
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
    `${bfgApi.products()}${productId}/inventory/`
  )
  if (Array.isArray(response)) {
    return response
  }
  return response.results || []
}

export async function updateVariantInventories(productId: number, inventories: VariantInventory[]): Promise<void> {
  return apiFetch<void>(`${bfgApi.products()}${productId}/inventory/`, {
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
  const response = await apiFetch<Store[] | { results: Store[]; data?: Store[] }>(bfgApi.stores())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getStore(id: number): Promise<Store> {
  return apiFetch<Store>(`${bfgApi.stores()}${id}/`)
}

export async function createStore(data: StorePayload): Promise<Store> {
  return apiFetch<Store>(bfgApi.stores(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateStore(id: number, data: Partial<StorePayload>): Promise<Store> {
  return apiFetch<Store>(`${bfgApi.stores()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteStore(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.stores()}${id}/`, {
    method: 'DELETE'
  })
}

// Sales Channels API
export async function getSalesChannels(): Promise<SalesChannel[]> {
  const response = await apiFetch<SalesChannel[] | { results: SalesChannel[]; data?: SalesChannel[] }>(bfgApi.salesChannels())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getSalesChannel(id: number): Promise<SalesChannel> {
  return apiFetch<SalesChannel>(`${bfgApi.salesChannels()}${id}/`)
}

export async function createSalesChannel(data: SalesChannelPayload): Promise<SalesChannel> {
  return apiFetch<SalesChannel>(bfgApi.salesChannels(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateSalesChannel(id: number, data: Partial<SalesChannelPayload>): Promise<SalesChannel> {
  return apiFetch<SalesChannel>(`${bfgApi.salesChannels()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteSalesChannel(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.salesChannels()}${id}/`, {
    method: 'DELETE'
  })
}

// Subscription Plans API
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiFetch<SubscriptionPlan[] | { results: SubscriptionPlan[]; data?: SubscriptionPlan[] }>(bfgApi.subscriptionPlans())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getSubscriptionPlan(id: number): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(`${bfgApi.subscriptionPlans()}${id}/`)
}

export async function createSubscriptionPlan(data: SubscriptionPlanPayload): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(bfgApi.subscriptionPlans(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlanPayload>): Promise<SubscriptionPlan> {
  return apiFetch<SubscriptionPlan>(`${bfgApi.subscriptionPlans()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteSubscriptionPlan(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.subscriptionPlans()}${id}/`, {
    method: 'DELETE'
  })
}

// Warehouses API (for dropdowns)
export async function getWarehouses(): Promise<Warehouse[]> {
  const response = await apiFetch<Warehouse[] | { results: Warehouse[] }>(bfgApi.warehouses())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || []
}

// Order types and API
export interface Order {
  id: number
  order_number: string
  customer?: number | string
  customer_name?: string
  store?: number | string
  store_name?: string
  total: number
  item_count?: number
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed'
  created_at: string
}

export async function getOrders(): Promise<Order[]> {
  const response = await apiFetch<Order[] | { results: Order[]; data?: Order[] }>(bfgApi.orders())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getOrder(id: number): Promise<Order> {
  return apiFetch<Order>(`${bfgApi.orders()}${id}/`)
}

export async function createOrder(data: Partial<Order>): Promise<Order> {
  return apiFetch<Order>(bfgApi.orders(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateOrder(id: number, data: Partial<Order>): Promise<Order> {
  return apiFetch<Order>(`${bfgApi.orders()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteOrder(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.orders()}${id}/`, { method: 'DELETE' })
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
  return apiFetch<DashboardStats>(`${base}/dashboard-stats/`)
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
  const response = await apiFetch<Customer[] | { results: Customer[]; data?: Customer[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getCustomer(id: number): Promise<Customer> {
  return apiFetch<Customer>(`${bfgApi.customers()}${id}/`)
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
  const response = await apiFetch<Address[] | { results: Address[] }>(`${bfgApi.addresses()}?customer=${customerId}`)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || []
}

export async function createAddress(data: Partial<Address>): Promise<Address> {
  return apiFetch<Address>(bfgApi.addresses(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateAddress(id: number, data: Partial<Address>): Promise<Address> {
  return apiFetch<Address>(`${bfgApi.addresses()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteAddress(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.addresses()}${id}/`, { method: 'DELETE' })
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  return apiFetch<Customer>(bfgApi.customers(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
  return apiFetch<Customer>(`${bfgApi.customers()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteCustomer(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.customers()}${id}/`, { method: 'DELETE' })
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
  const response = await apiFetch<Product[] | { results?: Product[]; data?: Product[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getProduct(id: number): Promise<Product> {
  return apiFetch<Product>(`${bfgApi.products()}${id}/`)
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(bfgApi.products(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(`${bfgApi.products()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteProduct(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.products()}${id}/`, { method: 'DELETE' })
}

export async function getCategories(lang: string = 'en'): Promise<Category[]> {
  // Use lang parameter instead of language (from admin)
  const url = `${bfgApi.products()}categories/?lang=${lang}`
  const response = await apiFetch<Category[] | { results?: Category[]; data?: Category[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getCategoriesTree(lang: string = 'en'): Promise<Category[]> {
  try {
    // Use tree=true parameter instead of /tree/ endpoint (from admin)
    const url = `${bfgApi.products()}categories/?lang=${lang}&tree=true`
    const response = await apiFetch<Category[] | { results?: Category[]; data?: Category[] }>(url)
    
    if (Array.isArray(response)) {
      return response
    }
    const categories = response.results || response.data || []
    return categories
  } catch (error: any) {
    console.error('[getCategoriesTree] Error:', error)
    // Try fallback without tree parameter
    try {
      const fallbackUrl = `${bfgApi.products()}categories/?lang=${lang}`
      const fallbackResponse = await apiFetch<Category[] | { results?: Category[]; data?: Category[] }>(fallbackUrl)
      if (Array.isArray(fallbackResponse)) {
        return fallbackResponse
      }
      return fallbackResponse.results || fallbackResponse.data || []
    } catch (fallbackError) {
      console.error('[getCategoriesTree] Fallback also failed:', fallbackError)
      return []
    }
  }
}

export async function getCategory(id: number): Promise<Category> {
  return apiFetch<Category>(`${bfgApi.products()}categories/${id}/`)
}

export interface CategoryRulesSchemaResponse {
  form_schema: FormSchema
}

export async function getCategoryRulesSchema(): Promise<FormSchema> {
  const res = await apiFetch<CategoryRulesSchemaResponse>(bfgApi.productCategoryRulesSchema())
  return res.form_schema
}

export type CategoryPayload = Omit<Category, 'id' | 'created_at' | 'updated_at' | 'children' | 'product_count'>

export async function createCategory(data: CategoryPayload): Promise<Category> {
  return apiFetch<Category>(`${bfgApi.products()}categories/`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCategory(id: number, data: Partial<CategoryPayload>): Promise<Category> {
  return apiFetch<Category>(`${bfgApi.products()}categories/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteCategory(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.products()}categories/${id}/`, {
    method: 'DELETE'
  })
}

/**
 * Tags API (from admin)
 */
export async function getTags(lang: string = 'en'): Promise<Tag[]> {
  const url = `${bfgApi.products()}tags/?lang=${lang}`
  const response = await apiFetch<Tag[] | { results?: Tag[]; data?: Tag[] }>(url)
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
  const response = await apiFetch<{ results?: ProductMedia[]; data?: ProductMedia[]; count?: number; next?: string | null; previous?: string | null }>(`${bfgApi.productMedia()}?${qs.toString()}`)
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
    method: 'POST',
    body: formData
  })
}

// Folder management APIs
export async function getProductMediaFolders(): Promise<{ folders: string[]; count: number }> {
  return apiFetch<{ folders: string[]; count: number }>(`${bfgApi.productMedia()}folders/`)
}

export async function createProductMediaFolder(folder: string): Promise<{ folder: string; message: string }> {
  return apiFetch<{ folder: string; message: string }>(`${bfgApi.productMedia()}create_folder/`, {
    method: 'POST',
    body: JSON.stringify({ folder })
  })
}

export async function deleteProductMediaFolder(folder: string): Promise<{ folder: string; deleted_count: number; message: string }> {
  const qs = new URLSearchParams()
  qs.set('folder', folder)
  return apiFetch<{ folder: string; deleted_count: number; message: string }>(`${bfgApi.productMedia()}delete_folder/?${qs.toString()}`, {
    method: 'DELETE'
  })
}

export async function deleteProductMedia(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.productMedia()}${id}/`, {
    method: 'DELETE'
  })
}

export async function deleteProductMediaFile(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${bfgApi.productMedia()}${id}/delete_file/`, {
    method: 'DELETE'
  })
}

export async function updateProductMedia(id: number, data: Partial<ProductMedia>): Promise<ProductMedia> {
  return apiFetch<ProductMedia>(`${bfgApi.productMedia()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function copyProductMediaToProduct(mediaId: number, targetProductId: number, isProductImage: boolean = true): Promise<ProductMedia> {
  return apiFetch<ProductMedia>(`${bfgApi.productMedia()}${mediaId}/copy_to_product/`, {
    method: 'POST',
    body: JSON.stringify({ product_id: targetProductId, is_product_image: isProductImage })
  })
}
