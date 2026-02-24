// Shipping API service (BFG2 Delivery + Shop modules)

import { apiFetch, buildApiUrl, API_VERSIONS } from '@/utils/api'

// Package Template types
export type PackageTemplate = {
  id: number
  code: string
  name: string
  description: string
  length: number
  width: number
  height: number
  tare_weight: number
  max_weight: number | null
  volume_cm3: number
  order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type PackageTemplatePayload = {
  code: string
  name: string
  description?: string
  length: number
  width: number
  height: number
  tare_weight?: number
  max_weight?: number | null
  order?: number
  is_active?: boolean
}

// Order Package types (uses bfg.delivery.Package model)
export type OrderPackage = {
  id: number
  order: number
  package_number: string
  template: number | null
  template_name: string | null
  length: number
  width: number
  height: number
  weight: number
  quantity: number  // maps to 'pieces' field
  volumetric_weight: number
  billing_weight: number
  total_billing_weight: number
  description: string
  notes: string
  created_at?: string
}

export type OrderPackagePayload = {
  order?: number
  template?: number | null
  package_number?: string
  length?: number
  width?: number
  height?: number
  weight: number
  quantity?: number  // maps to 'pieces' field
  description?: string
  notes?: string
}

// Freight Service types
export type FreightService = {
  id: number
  carrier: number
  carrier_name: string
  name: string
  code: string
  description: string
  base_price: number
  price_per_kg: number
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
  order: number
  config: Record<string, any>
}

// Shipping calculation response
export type ShippingCalculationResult = {
  total_packages: number
  total_actual_weight: string
  total_volumetric_weight: string
  total_billing_weight: string
  shipping_cost: string
  freight_service?: string
  message?: string
}

// Shipping update response
export type ShippingUpdateResult = {
  order_id: number
  shipping_cost: string
  total: string
  freight_service: string
  billing_weight: string
}

// ============================================================================
// Package Template API
// ============================================================================

export async function getPackageTemplates(): Promise<PackageTemplate[]> {
  const url = buildApiUrl('/package-templates/?active=true', API_VERSIONS.BFG2)
  const response = await apiFetch<PackageTemplate[] | { results?: PackageTemplate[]; data?: PackageTemplate[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getPackageTemplate(id: number): Promise<PackageTemplate> {
  const url = buildApiUrl(`/package-templates/${id}/`, API_VERSIONS.BFG2)
  return apiFetch<PackageTemplate>(url)
}

export async function createPackageTemplate(data: PackageTemplatePayload): Promise<PackageTemplate> {
  const url = buildApiUrl('/package-templates/', API_VERSIONS.BFG2)
  return apiFetch<PackageTemplate>(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updatePackageTemplate(id: number, data: Partial<PackageTemplatePayload>): Promise<PackageTemplate> {
  const url = buildApiUrl(`/package-templates/${id}/`, API_VERSIONS.BFG2)
  return apiFetch<PackageTemplate>(url, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deletePackageTemplate(id: number): Promise<void> {
  const url = buildApiUrl(`/package-templates/${id}/`, API_VERSIONS.BFG2)
  return apiFetch<void>(url, {
    method: 'DELETE'
  })
}

// ============================================================================
// Order Package API
// ============================================================================

export async function getOrderPackages(orderId: number): Promise<OrderPackage[]> {
  const url = buildApiUrl(`/order-packages/?order=${orderId}`, API_VERSIONS.BFG2)
  const response = await apiFetch<OrderPackage[] | { results?: OrderPackage[]; data?: OrderPackage[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function createOrderPackage(data: OrderPackagePayload): Promise<OrderPackage> {
  const url = buildApiUrl('/order-packages/', API_VERSIONS.BFG2)
  return apiFetch<OrderPackage>(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateOrderPackage(id: number, data: Partial<OrderPackagePayload>): Promise<OrderPackage> {
  const url = buildApiUrl(`/order-packages/${id}/`, API_VERSIONS.BFG2)
  return apiFetch<OrderPackage>(url, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteOrderPackage(id: number): Promise<void> {
  const url = buildApiUrl(`/order-packages/${id}/`, API_VERSIONS.BFG2)
  return apiFetch<void>(url, {
    method: 'DELETE'
  })
}

// ============================================================================
// Shipping Calculation API
// ============================================================================

export async function calculateShipping(
  orderId: number, 
  freightServiceId?: number
): Promise<ShippingCalculationResult> {
  const url = buildApiUrl('/order-packages/calculate_shipping/', API_VERSIONS.BFG2)
  return apiFetch<ShippingCalculationResult>(url, {
    method: 'POST',
    body: JSON.stringify({
      order: orderId,
      freight_service_id: freightServiceId
    })
  })
}

export async function updateOrderShipping(
  orderId: number, 
  freightServiceId: number
): Promise<ShippingUpdateResult> {
  const url = buildApiUrl('/order-packages/update_order_shipping/', API_VERSIONS.BFG2, 'shop')
  return apiFetch<ShippingUpdateResult>(url, {
    method: 'POST',
    body: JSON.stringify({
      order: orderId,
      freight_service_id: freightServiceId
    })
  })
}

// ============================================================================
// Freight Service API
// ============================================================================

export async function getFreightServices(): Promise<FreightService[]> {
  const url = buildApiUrl('/freight-services/?active=true', API_VERSIONS.BFG2)
  const response = await apiFetch<FreightService[] | { results?: FreightService[]; data?: FreightService[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getFreightService(id: number): Promise<FreightService> {
  const url = buildApiUrl(`/freight-services/${id}/`, API_VERSIONS.BFG2)
  return apiFetch<FreightService>(url)
}

// ============================================================================
// Carrier API
// ============================================================================

export type Carrier = {
  id: number
  name: string
  code: string
  carrier_type: string
  is_active: boolean
  is_test_mode: boolean
  tracking_url_template: string
}

export type ShippingOption = {
  service_code: string
  service_name: string
  price: string
  currency: string
  estimated_days_min: number
  estimated_days_max: number
  carrier_name?: string
  carrier_id?: string
  carrier_method_desc?: string
}

export type PickupAddress = {
  name: string
  address_line1: string
  address_line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
  phone?: string
}

export type ShippingOptionsParams = {
  order_id: number
  pickup_address?: PickupAddress
}

export type ShippingOptionsResult = {
  carrier_id: number
  carrier_name: string
  order_id: number
  options: ShippingOption[]
}

export type ShipOrderResult = {
  success: boolean
  consignment_id?: number
  consignment_number?: string
  tracking_number?: string
  label_url?: string
  carrier_name?: string
  service_code?: string
  error?: string
}

export type ConsignmentListItem = {
  id: number
  consignment_number: string
  tracking_number: string
  service_name: string
  carrier_name: string
  state: string
  status_name: string
  created_at: string
}

export type LabelResult = {
  success: boolean
  label_url?: string
  error?: string
}

export async function getCarriers(): Promise<Carrier[]> {
  const url = buildApiUrl('/carriers/', API_VERSIONS.BFG2)
  const response = await apiFetch<Carrier[] | { results?: Carrier[]; data?: Carrier[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getShippingOptions(orderId: number, carrierId: number, pickupAddress?: PickupAddress): Promise<ShippingOptionsResult> {
  const url = buildApiUrl(`/carriers/${carrierId}/get_shipping_options/`, API_VERSIONS.BFG2)
  const payload: ShippingOptionsParams = { order_id: orderId }
  if (pickupAddress) {
    payload.pickup_address = pickupAddress
  }
  return apiFetch<ShippingOptionsResult>(url, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function shipOrder(
  orderId: number, 
  carrierId: number, 
  serviceCode: string,
  serviceName?: string,
  price?: string
): Promise<ShipOrderResult> {
  const url = buildApiUrl(`/carriers/${carrierId}/ship_order/`, API_VERSIONS.BFG2)
  return apiFetch<ShipOrderResult>(url, {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      service_code: serviceCode,
      service_name: serviceName,
      price: price
    })
  })
}

export async function getOrderConsignments(orderId: number): Promise<ConsignmentListItem[]> {
  const url = buildApiUrl(`/consignments/?order=${orderId}`, API_VERSIONS.BFG2)
  const response = await apiFetch<ConsignmentListItem[] | { results?: ConsignmentListItem[]; data?: ConsignmentListItem[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getConsignmentLabel(consignmentNumber: string): Promise<LabelResult> {
  const url = buildApiUrl(`/consignments/${consignmentNumber}/generate_label/`, API_VERSIONS.BFG2)
  return apiFetch<LabelResult>(url, {
    method: 'POST'
  })
}

export async function deleteConsignment(consignmentId: number): Promise<void> {
  const url = buildApiUrl(`/consignments/by-id/${consignmentId}/`, API_VERSIONS.BFG2)
  await apiFetch<void>(url, {
    method: 'DELETE'
  })
}

// ============================================================================
// Warehouse API
// ============================================================================

export type Warehouse = {
  id: number
  name: string
  code: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
  email: string
  is_default: boolean
  is_active: boolean
}

export async function getWarehouses(): Promise<Warehouse[]> {
  const url = buildApiUrl('/warehouses/', API_VERSIONS.BFG2)
  const response = await apiFetch<Warehouse[] | { results?: Warehouse[]; data?: Warehouse[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getDefaultWarehouse(): Promise<Warehouse | null> {
  const warehouses = await getWarehouses()
  return warehouses.find(w => w.is_default && w.is_active) || warehouses.find(w => w.is_active) || null
}
