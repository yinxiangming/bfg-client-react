// bfg.web booking & time slots API

import { apiFetch, bfgApi } from '@/utils/api'

export type BookingSlotType = 'dropoff' | 'pickup' | 'appointment' | 'reservation' | 'consultation'

export interface BookingTimeSlot {
  id: number
  workspace: number
  site?: number | null
  slot_type: BookingSlotType
  name?: string
  date: string
  start_time: string
  end_time: string
  max_bookings: number
  current_bookings: number
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Booking {
  id: number
  workspace: number
  timeslot: number
  customer?: number | null
  name?: string
  email?: string
  phone?: string
  status: BookingStatus
  notes?: string
  admin_notes?: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  slot_type?: BookingSlotType
  slot_date?: string
  slot_start_time?: string
  slot_end_time?: string
}

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

export async function getBookingTimeSlots(
  params?: TimeSlotListParams
): Promise<TimeSlotListResponse> {
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

export async function getAvailableTimeSlots(
  params?: Omit<TimeSlotListParams, 'is_active'>
): Promise<BookingTimeSlot[]> {
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

export async function createBookingTimeSlot(
  data: Partial<BookingTimeSlot>
): Promise<BookingTimeSlot> {
  return apiFetch<BookingTimeSlot>(bfgApi.timeslots(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateBookingTimeSlot(
  id: number,
  data: Partial<BookingTimeSlot>
): Promise<BookingTimeSlot> {
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

export async function getMyBookings(): Promise<Booking[]> {
  const base = bfgApi.bookings().replace(/\/+$/, '')
  const response = await apiFetch<Booking[]>(`${base}/my/`)
  return Array.isArray(response) ? response : []
}

export async function createBooking(data: Partial<Booking>): Promise<Booking> {
  return apiFetch<Booking>(bfgApi.bookings(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function cancelBooking(id: number): Promise<Booking> {
  return apiFetch<Booking>(`${bfgApi.bookings()}${id}/cancel/`, {
    method: 'POST'
  })
}
