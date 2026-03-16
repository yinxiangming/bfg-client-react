// Support API service (BFG Support module)

import { apiFetch, bfgApi } from '@/utils/api'

export interface SupportOptions {
  ticket_statuses: Array<{ value: string; label: string }>
  ticket_priorities: Array<{ value: number; label: string; level?: number; color?: string }>
  ticket_categories: Array<{ value: number; label: string; order?: number }>
}

export interface TicketMessage {
  id: number
  message: string
  is_staff_reply: boolean
  is_internal: boolean
  sender: number | null
  sender_name: string | null
  created_at: string
}

export interface TicketAssignment {
  id: number
  assigned_from: number | null
  assigned_from_name: string | null
  assigned_to: number | null
  assigned_to_name: string | null
  assigned_by: number | null
  assigned_by_name: string | null
  reason: string
  assigned_at: string
}

export interface SupportTicket {
  id: number
  ticket_number: string
  subject: string
  description?: string
  customer: number
  customer_name?: string | null
  category?: number | null
  category_name?: string | null
  priority?: number | null
  priority_name?: string | null
  status: string
  channel?: string
  assigned_to?: number | null
  assigned_to_name?: string | null
  team?: number | null
  related_order?: number | null
  created_at: string
  updated_at: string
  first_response_at?: string | null
  resolved_at?: string | null
  closed_at?: string | null
  messages?: TicketMessage[]
  messages_count?: number
  assignments?: TicketAssignment[]
}

export interface SupportTicketPayload {
  subject: string
  description: string
  customer: number
  category?: number | null
  priority?: number | null
  status?: string
  channel?: string
  assigned_to?: number | null
  team?: number | null
  related_order?: number | null
}

export async function getSupportOptions(): Promise<SupportOptions> {
  const data = await apiFetch<SupportOptions>(bfgApi.supportOptions())
  return {
    ticket_statuses: data?.ticket_statuses ?? [],
    ticket_priorities: data?.ticket_priorities ?? [],
    ticket_categories: data?.ticket_categories ?? []
  }
}

export async function getTickets(params?: { status?: string; priority?: string; scope?: 'my' | 'unassigned' }): Promise<SupportTicket[]> {
  const qs = new URLSearchParams()
  if (params?.scope) qs.set('scope', params.scope)
  if (params?.status) qs.set('status', params.status)
  if (params?.priority) qs.set('priority', params.priority)
  const url = qs.toString() ? `${bfgApi.tickets()}?${qs}` : bfgApi.tickets()
  const response = await apiFetch<SupportTicket[] | { results: SupportTicket[] }>(url)
  if (Array.isArray(response)) return response
  return response?.results ?? []
}

export async function getTicket(id: number): Promise<SupportTicket> {
  return apiFetch<SupportTicket>(bfgApi.ticket(id))
}

const MESSAGES_PAGE_SIZE = 10

export interface TicketMessagesResponse {
  count: number
  results: TicketMessage[]
  page: number
  page_size: number
}

export async function getTicketMessages(
  ticketId: number,
  page: number = 1,
  pageSize: number = MESSAGES_PAGE_SIZE
): Promise<TicketMessagesResponse> {
  const url = `${bfgApi.ticketMessages(ticketId)}?page=${page}&page_size=${pageSize}`
  return apiFetch<TicketMessagesResponse>(url)
}

export async function createTicket(payload: SupportTicketPayload): Promise<SupportTicket> {
  return apiFetch<SupportTicket>(bfgApi.tickets(), {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateTicket(id: number, payload: Partial<SupportTicketPayload>): Promise<SupportTicket> {
  return apiFetch<SupportTicket>(bfgApi.ticket(id), {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export async function deleteTicket(id: number): Promise<void> {
  return apiFetch<void>(bfgApi.ticket(id), {
    method: 'DELETE'
  })
}

/** Add a staff reply to a ticket. Returns updated ticket with messages. */
export async function replyTicket(
  id: number,
  payload: { message: string; is_internal?: boolean }
): Promise<SupportTicket> {
  const url = `${bfgApi.ticket(id).replace(/\/$/, '')}/reply/`
  return apiFetch<SupportTicket>(url, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

// Ticket categories (settings)
export interface TicketCategory {
  id: number
  name: string
  description?: string
  order: number
  is_active: boolean
}

export interface TicketCategoryPayload {
  name: string
  description?: string
  order?: number
  is_active?: boolean
}

export async function getTicketCategories(): Promise<TicketCategory[]> {
  const res = await apiFetch<TicketCategory[] | { results: TicketCategory[] }>(bfgApi.ticketCategories())
  if (Array.isArray(res)) return res
  return res?.results ?? []
}

export async function createTicketCategory(payload: TicketCategoryPayload): Promise<TicketCategory> {
  return apiFetch<TicketCategory>(bfgApi.ticketCategories(), {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateTicketCategory(id: number, payload: Partial<TicketCategoryPayload>): Promise<TicketCategory> {
  return apiFetch<TicketCategory>(bfgApi.ticketCategory(id), {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export async function deleteTicketCategory(id: number): Promise<void> {
  return apiFetch<void>(bfgApi.ticketCategory(id), { method: 'DELETE' })
}

// Ticket priorities (settings)
export interface TicketPriority {
  id: number
  name: string
  level: number
  color?: string
  response_time_hours?: number | null
  resolution_time_hours?: number | null
  is_active: boolean
}

export interface TicketPriorityPayload {
  name: string
  level: number
  color?: string
  response_time_hours?: number | null
  resolution_time_hours?: number | null
  is_active?: boolean
}

export async function getTicketPriorities(): Promise<TicketPriority[]> {
  const res = await apiFetch<TicketPriority[] | { results: TicketPriority[] }>(bfgApi.ticketPriorities())
  if (Array.isArray(res)) return res
  return res?.results ?? []
}

export async function createTicketPriority(payload: TicketPriorityPayload): Promise<TicketPriority> {
  return apiFetch<TicketPriority>(bfgApi.ticketPriorities(), {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateTicketPriority(id: number, payload: Partial<TicketPriorityPayload>): Promise<TicketPriority> {
  return apiFetch<TicketPriority>(bfgApi.ticketPriority(id), {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
}

export async function deleteTicketPriority(id: number): Promise<void> {
  return apiFetch<void>(bfgApi.ticketPriority(id), { method: 'DELETE' })
}
