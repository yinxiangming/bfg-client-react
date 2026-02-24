// Delivery API service (BFG2 Freight module)

import { apiFetch, bfgApi } from '@/utils/api'
import type { FormSchema } from '@/types/schema'

export type Warehouse = {
  id: number
  name: string
  code: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  latitude?: number | string
  longitude?: number | string
  phone?: string
  email?: string
  is_active: boolean
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

export type WarehousePayload = Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>

export type Carrier = {
  id: number
  name: string
  code: string
  carrier_type?: string
  config?: Record<string, any>
  test_config?: Record<string, any>
  is_test_mode?: boolean
  tracking_url_template?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CarrierPayload = Omit<Carrier, 'id' | 'created_at' | 'updated_at'>

export type CarrierPluginInfo = {
  carrier_type: string
  display_name: string
  supported_countries: string[]
  config_schema: Record<string, any>
}

export type PackagingType = {
  id: number
  name: string
  code?: string
  description?: string
  order?: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type PackagingTypePayload = Omit<PackagingType, 'id' | 'created_at' | 'updated_at'>

export type FreightService = {
  id: number
  carrier: number
  carrier_name?: string
  name: string
  code: string
  description?: string
  base_price: number
  price_per_kg: number
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
  order: number
  config?: Record<string, unknown>
}

export type FreightServicePayload = Omit<FreightService, 'id' | 'created_at' | 'updated_at' | 'carrier_name'>

/** Template form field from backend (form_schema item). */
export type FreightTemplateFormField = {
  field: string
  label: string
  label_zh?: string
  type: string
  required?: boolean
  defaultValue?: unknown
  helperText?: string
  example?: string
  placeholder?: string
  rows?: number
  itemSchema?: Record<string, string>
}

export type FreightTemplate = {
  id: string
  label: string
  label_zh?: string
  description?: string
  description_zh?: string
  mode: string
  form_schema: FreightTemplateFormField[]
}

export type FreightStatus = {
  id: number
  code: string
  name: string
  type: string
  state: string
  description?: string
  color?: string
  order?: number
  is_active: boolean
}

export type FreightStatusPayload = Omit<FreightStatus, 'id'>

export type DeliveryZone = {
  id: number
  name: string
  code: string
  countries: string[]
  postal_code_patterns: string[]
  is_active: boolean
}

export type DeliveryZonePayload = Omit<DeliveryZone, 'id'>

export type TrackingEvent = {
  id: number
  event_type: string
  description?: string
  location?: string
  event_time: string
  consignment?: number
  package?: number
  created_at?: string
}

export type TrackingEventPayload = Omit<TrackingEvent, 'id' | 'created_at'>

// Warehouses
export async function getWarehouses(): Promise<Warehouse[]> {
  const response = await apiFetch<Warehouse[] | { results: Warehouse[]; data?: Warehouse[] }>(bfgApi.warehouses())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getWarehouse(id: number): Promise<Warehouse> {
  return apiFetch<Warehouse>(`${bfgApi.warehouses()}${id}/`)
}

export async function createWarehouse(data: WarehousePayload): Promise<Warehouse> {
  return apiFetch<Warehouse>(bfgApi.warehouses(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateWarehouse(id: number, data: Partial<WarehousePayload>): Promise<Warehouse> {
  return apiFetch<Warehouse>(`${bfgApi.warehouses()}${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteWarehouse(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.warehouses()}${id}/`, { method: 'DELETE' })
}

// Carriers
export async function getCarriers(): Promise<Carrier[]> {
  const response = await apiFetch<Carrier[] | { results: Carrier[]; data?: Carrier[] }>(bfgApi.carriers())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getCarrier(id: number): Promise<Carrier> {
  return apiFetch<Carrier>(`${bfgApi.carriers()}${id}/`)
}

export async function createCarrier(data: CarrierPayload): Promise<Carrier> {
  return apiFetch<Carrier>(bfgApi.carriers(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCarrier(id: number, data: Partial<CarrierPayload>): Promise<Carrier> {
  return apiFetch<Carrier>(`${bfgApi.carriers()}${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteCarrier(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.carriers()}${id}/`, { method: 'DELETE' })
}

export async function getCarrierPlugins(): Promise<CarrierPluginInfo[]> {
  return apiFetch<CarrierPluginInfo[]>(`${bfgApi.carriers()}plugins/`)
}

// Packaging Types
export async function getPackagingTypes(): Promise<PackagingType[]> {
  const response = await apiFetch<PackagingType[] | { results: PackagingType[]; data?: PackagingType[] }>(bfgApi.packagingTypes())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getPackagingType(id: number): Promise<PackagingType> {
  return apiFetch<PackagingType>(`${bfgApi.packagingTypes()}${id}/`)
}

export async function createPackagingType(data: PackagingTypePayload): Promise<PackagingType> {
  return apiFetch<PackagingType>(bfgApi.packagingTypes(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updatePackagingType(id: number, data: Partial<PackagingTypePayload>): Promise<PackagingType> {
  return apiFetch<PackagingType>(`${bfgApi.packagingTypes()}${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deletePackagingType(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.packagingTypes()}${id}/`, { method: 'DELETE' })
}

// Freight Service
export async function getFreightServices(): Promise<FreightService[]> {
  const response = await apiFetch<FreightService[] | { results: FreightService[]; data?: FreightService[] }>(bfgApi.freightServices())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getFreightService(id: number): Promise<FreightService> {
  return apiFetch<FreightService>(`${bfgApi.freightServices()}${id}/`)
}

export interface FreightServiceConfigSchemaResponse {
  form_schema: FormSchema
}

export async function getFreightServiceFormSchema(templateId?: string): Promise<FormSchema> {
  const url = bfgApi.freightServiceConfigSchema(templateId)
  const res = await apiFetch<{ form_schema: FormSchema | unknown[] }>(url)
  const raw = res.form_schema
  if (Array.isArray(raw)) {
    return { fields: raw as FormSchema['fields'] }
  }
  return raw as FormSchema
}

export async function getFreightTemplates(): Promise<FreightTemplate[]> {
  return apiFetch<FreightTemplate[]>(bfgApi.freightServiceTemplates())
}

export async function createFreightService(data: FreightServicePayload): Promise<FreightService> {
  return apiFetch<FreightService>(bfgApi.freightServices(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateFreightService(id: number, data: Partial<FreightServicePayload>): Promise<FreightService> {
  return apiFetch<FreightService>(`${bfgApi.freightServices()}${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/** Update freight service config from a pricing template (PATCH, no JSON). */
export async function updateFreightServiceConfig(
  id: number,
  templateId: string,
  templateParams: Record<string, unknown>
): Promise<FreightService> {
  return apiFetch<FreightService>(`${bfgApi.freightServices()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ template_id: templateId, template_params: templateParams })
  })
}

export async function deleteFreightService(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.freightServices()}${id}/`, { method: 'DELETE' })
}

// Freight Status
export async function getFreightStatuses(): Promise<FreightStatus[]> {
  const response = await apiFetch<FreightStatus[] | { results: FreightStatus[]; data?: FreightStatus[] }>(bfgApi.freightStatuses())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getFreightStatus(id: number): Promise<FreightStatus> {
  return apiFetch<FreightStatus>(`${bfgApi.freightStatuses()}${id}/`)
}

export async function createFreightStatus(data: FreightStatusPayload): Promise<FreightStatus> {
  return apiFetch<FreightStatus>(bfgApi.freightStatuses(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateFreightStatus(id: number, data: Partial<FreightStatusPayload>): Promise<FreightStatus> {
  return apiFetch<FreightStatus>(`${bfgApi.freightStatuses()}${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteFreightStatus(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.freightStatuses()}${id}/`, { method: 'DELETE' })
}

// Delivery Zone
export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const response = await apiFetch<DeliveryZone[] | { results: DeliveryZone[]; data?: DeliveryZone[] }>(bfgApi.deliveryZones())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getDeliveryZone(id: number): Promise<DeliveryZone> {
  return apiFetch<DeliveryZone>(`${bfgApi.deliveryZones()}${id}/`)
}

export async function createDeliveryZone(data: DeliveryZonePayload): Promise<DeliveryZone> {
  return apiFetch<DeliveryZone>(bfgApi.deliveryZones(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateDeliveryZone(id: number, data: Partial<DeliveryZonePayload>): Promise<DeliveryZone> {
  return apiFetch<DeliveryZone>(`${bfgApi.deliveryZones()}${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteDeliveryZone(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.deliveryZones()}${id}/`, { method: 'DELETE' })
}

// Tracking Event
export async function getTrackingEvents(): Promise<TrackingEvent[]> {
  const response = await apiFetch<TrackingEvent[] | { results: TrackingEvent[]; data?: TrackingEvent[] }>(bfgApi.trackingEvents())
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getTrackingEvent(id: number): Promise<TrackingEvent> {
  return apiFetch<TrackingEvent>(`${bfgApi.trackingEvents()}${id}/`)
}

export async function createTrackingEvent(data: TrackingEventPayload): Promise<TrackingEvent> {
  return apiFetch<TrackingEvent>(bfgApi.trackingEvents(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateTrackingEvent(id: number, data: Partial<TrackingEventPayload>): Promise<TrackingEvent> {
  return apiFetch<TrackingEvent>(`${bfgApi.trackingEvents()}${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function deleteTrackingEvent(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.trackingEvents()}${id}/`, { method: 'DELETE' })
}

