// Resale API service

import { apiFetch, bfgApi } from '@/utils/api'
import { resaleApi } from './api'
import type {
  ResaleSettings,
  ResaleProduct,
  ResalePayout,
  ResaleCustomerPreference,
  BookingTimeSlot,
  Booking
} from '../types'

/**
 * Resale Settings API
 */
export async function getResaleSettings(): Promise<ResaleSettings> {
  return apiFetch<ResaleSettings>(resaleApi.settings())
}

export async function updateResaleSettings(data: Partial<ResaleSettings>): Promise<ResaleSettings> {
  return apiFetch<ResaleSettings>(resaleApi.settings(), {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

/**
 * Resale Products API
 */
interface ResaleProductListParams {
  customer?: number
  status?: string
  product?: number
}

interface ResaleProductListResponse {
  results: ResaleProduct[]
  count: number
  next?: string | null
  previous?: string | null
}

export async function getResaleProducts(params?: ResaleProductListParams): Promise<ResaleProductListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.customer) queryParams.append('customer', params.customer.toString())
  if (params?.status) queryParams.append('status', params.status)
  if (params?.product) queryParams.append('product', params.product.toString())

  const url = queryParams.toString()
    ? `${resaleApi.products()}?${queryParams.toString()}`
    : resaleApi.products()

  return apiFetch<ResaleProductListResponse>(url)
}

export async function getResaleProduct(id: number): Promise<ResaleProduct> {
  return apiFetch<ResaleProduct>(`${resaleApi.products()}${id}/`)
}

export async function getResaleProductByProduct(productId: number): Promise<ResaleProduct | null> {
  const response = await getResaleProducts({ product: productId })
  return response.results.length > 0 ? response.results[0] : null
}

export async function createResaleProduct(data: Partial<ResaleProduct>): Promise<ResaleProduct> {
  return apiFetch<ResaleProduct>(resaleApi.products(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateResaleProduct(id: number, data: Partial<ResaleProduct>): Promise<ResaleProduct> {
  return apiFetch<ResaleProduct>(`${resaleApi.products()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteResaleProduct(id: number): Promise<void> {
  return apiFetch<void>(`${resaleApi.products()}${id}/`, {
    method: 'DELETE'
  })
}

/**
 * Get product owner (customer) info by product_id.
 * Used by storefront (display) and admin edit (form pre-fill).
 */
export interface ProductOwnerInfo {
  has_owner: boolean
  status?: string
  commission_rate?: number | null
  customer?: { id?: number; display_name?: string | null }
}

export async function getProductOwnerInfo(productId: number): Promise<ProductOwnerInfo> {
  return apiFetch<ProductOwnerInfo>(resaleApi.productOwner(productId))
}

/**
 * Resale Payouts API
 */
interface ResalePayoutListParams {
  customer?: number
  status?: string
  page?: number
  page_size?: number
}

interface ResalePayoutListResponse {
  results: ResalePayout[]
  count: number
  next?: string | null
  previous?: string | null
}

export async function getResalePayouts(params?: ResalePayoutListParams): Promise<ResalePayoutListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.customer) queryParams.append('customer', params.customer.toString())
  if (params?.status) queryParams.append('status', params.status)
  if (params?.page != null) queryParams.append('page', String(params.page))
  if (params?.page_size != null) queryParams.append('page_size', String(params.page_size))

  const base = resaleApi.payouts().replace(/\/+$/, '')
  const url = queryParams.toString() ? `${base}?${queryParams.toString()}` : base
  return apiFetch<ResalePayoutListResponse>(url)
}

export interface ResalePayoutStatsParams {
  customer?: number
  status?: string
}

export interface ResalePayoutStats {
  total_count: number
  pending_count: number
  paid_count: number
  paid_sum: number
  payable_sum: number
}

export async function getResalePayoutStats(params?: ResalePayoutStatsParams): Promise<ResalePayoutStats> {
  const queryParams = new URLSearchParams()
  if (params?.customer) queryParams.append('customer', params.customer.toString())
  if (params?.status) queryParams.append('status', params.status)
  const base = resaleApi.payouts().replace(/\/+$/, '')
  const statsBase = `${base}/stats/`
  const url = queryParams.toString() ? `${statsBase}?${queryParams.toString()}` : statsBase
  return apiFetch<ResalePayoutStats>(url)
}

export async function getResalePayout(id: number): Promise<ResalePayout> {
  return apiFetch<ResalePayout>(`${resaleApi.payouts()}${id}/`)
}

export async function createResalePayoutBatch(customerId: number): Promise<ResalePayout> {
  return apiFetch<ResalePayout>(`${resaleApi.payouts()}create-batch/`, {
    method: 'POST',
    body: JSON.stringify({ customer_id: customerId })
  })
}

export async function updateResalePayout(id: number, data: Partial<ResalePayout>): Promise<ResalePayout> {
  return apiFetch<ResalePayout>(`${resaleApi.payouts()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function markResalePayoutAsPaid(
  id: number,
  options?: { payment_reference?: string; payment_method?: string }
): Promise<ResalePayout> {
  return apiFetch<ResalePayout>(`${resaleApi.payouts()}${id}/mark-paid/`, {
    method: 'POST',
    body: JSON.stringify({
      payment_reference: options?.payment_reference ?? '',
      payment_method: options?.payment_method ?? ''
    })
  })
}

/**
 * Resale customer preference (how customer prefers to receive payout)
 */
export async function getResaleCustomerPreference(customerId: number): Promise<ResaleCustomerPreference> {
  return apiFetch<ResaleCustomerPreference>(resaleApi.customerPreference(customerId))
}

export async function updateResaleCustomerPreference(
  customerId: number,
  data: Partial<Pick<ResaleCustomerPreference, 'preferred_payout_method' | 'payout_method_notes'>>
): Promise<ResaleCustomerPreference> {
  return apiFetch<ResaleCustomerPreference>(resaleApi.customerPreference(customerId), {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

/** Get/update current user's resale payout preference (account page). */
export async function getMyResalePreference(): Promise<ResaleCustomerPreference> {
  return apiFetch<ResaleCustomerPreference>(resaleApi.myPreference())
}

export async function updateMyResalePreference(
  data: Partial<Pick<ResaleCustomerPreference, 'preferred_payout_method' | 'payout_method_notes'>>
): Promise<ResaleCustomerPreference> {
  return apiFetch<ResaleCustomerPreference>(resaleApi.myPreference(), {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

/**
 * Booking Time Slots API
 */
interface TimeSlotListParams {
  slot_type?: string
  date?: string
  date_from?: string
  date_to?: string
  site?: number
  is_active?: boolean
}

interface TimeSlotListResponse {
  results: BookingTimeSlot[]
  count: number
  next?: string | null
  previous?: string | null
}

export async function getBookingTimeSlots(params?: TimeSlotListParams): Promise<TimeSlotListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.slot_type) queryParams.append('slot_type', params.slot_type)
  if (params?.date) queryParams.append('date', params.date)
  if (params?.date_from) queryParams.append('date_from', params.date_from)
  if (params?.date_to) queryParams.append('date_to', params.date_to)
  if (params?.site) queryParams.append('site', params.site.toString())
  if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())

  const url = queryParams.toString()
    ? `${bfgApi.timeslots()}?${queryParams.toString()}`
    : bfgApi.timeslots()

  const response = await apiFetch<TimeSlotListResponse | BookingTimeSlot[]>(url)
  if (Array.isArray(response)) {
    return { results: response, count: response.length }
  }
  return response
}

export async function getAvailableTimeSlots(params?: Omit<TimeSlotListParams, 'is_active'>): Promise<BookingTimeSlot[]> {
  const queryParams = new URLSearchParams()
  if (params?.slot_type) queryParams.append('slot_type', params.slot_type)
  if (params?.date) queryParams.append('date', params.date)
  if (params?.date_from) queryParams.append('date_from', params.date_from)
  if (params?.date_to) queryParams.append('date_to', params.date_to)
  if (params?.site) queryParams.append('site', params.site.toString())

  const url = queryParams.toString()
    ? `${bfgApi.timeslots()}available/?${queryParams.toString()}`
    : `${bfgApi.timeslots()}available/`

  return apiFetch<BookingTimeSlot[]>(url)
}

export async function getBookingTimeSlot(id: number): Promise<BookingTimeSlot> {
  return apiFetch<BookingTimeSlot>(`${bfgApi.timeslots()}${id}/`)
}

export async function createBookingTimeSlot(data: Partial<BookingTimeSlot>): Promise<BookingTimeSlot> {
  return apiFetch<BookingTimeSlot>(bfgApi.timeslots(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateBookingTimeSlot(id: number, data: Partial<BookingTimeSlot>): Promise<BookingTimeSlot> {
  return apiFetch<BookingTimeSlot>(`${bfgApi.timeslots()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteBookingTimeSlot(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.timeslots()}${id}/`, {
    method: 'DELETE'
  })
}

/**
 * Bookings API
 */
interface BookingListParams {
  timeslot?: number
  customer?: number
  status?: string
  slot_type?: string
  date_from?: string
  date_to?: string
}

interface BookingListResponse {
  results: Booking[]
  count: number
  next?: string | null
  previous?: string | null
}

export async function getBookings(params?: BookingListParams): Promise<BookingListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.timeslot) queryParams.append('timeslot', params.timeslot.toString())
  if (params?.customer) queryParams.append('customer', params.customer.toString())
  if (params?.status) queryParams.append('status', params.status)
  if (params?.slot_type) queryParams.append('slot_type', params.slot_type)
  if (params?.date_from) queryParams.append('date_from', params.date_from)
  if (params?.date_to) queryParams.append('date_to', params.date_to)

  const url = queryParams.toString()
    ? `${bfgApi.bookings()}?${queryParams.toString()}`
    : bfgApi.bookings()

  const response = await apiFetch<BookingListResponse | Booking[]>(url)
  if (Array.isArray(response)) {
    return { results: response, count: response.length }
  }
  return response
}

export async function getBooking(id: number): Promise<Booking> {
  return apiFetch<Booking>(`${bfgApi.bookings()}${id}/`)
}

export async function createBooking(data: Partial<Booking>): Promise<Booking> {
  return apiFetch<Booking>(bfgApi.bookings(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateBooking(id: number, data: Partial<Booking>): Promise<Booking> {
  return apiFetch<Booking>(`${bfgApi.bookings()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function confirmBooking(id: number): Promise<Booking> {
  return apiFetch<Booking>(`${bfgApi.bookings()}${id}/confirm/`, {
    method: 'POST'
  })
}

export async function cancelBooking(id: number): Promise<Booking> {
  return apiFetch<Booking>(`${bfgApi.bookings()}${id}/cancel/`, {
    method: 'POST'
  })
}

/**
 * My Resale API (for customer account page)
 */
export async function getMyResaleProducts(): Promise<ResaleProduct[]> {
  const response = await apiFetch<ResaleProduct[] | { results: ResaleProduct[] }>(resaleApi.myProducts())
  return Array.isArray(response) ? response : response.results || []
}

export async function getMyResalePayouts(): Promise<ResalePayout[]> {
  const response = await apiFetch<ResalePayout[] | { results: ResalePayout[] }>(resaleApi.myPayouts())
  return Array.isArray(response) ? response : response.results || []
}

/** List bookings for current user (customer) in account. */
export async function getMyBookings(): Promise<Booking[]> {
  const base = bfgApi.bookings().replace(/\/+$/, '')
  const response = await apiFetch<Booking[]>(`${base}/my/`)
  return Array.isArray(response) ? response : []
}
