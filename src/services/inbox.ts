import { apiFetch, bfgApi } from '@/utils/api'

export type AdminMessagePayload = {
  subject: string
  message: string
  message_type?: 'notification' | 'message' | 'system'
  action_url?: string | null
  action_label?: string | null
  send_email?: boolean
  send_sms?: boolean
  send_push?: boolean
  expires_at?: string | null
}

export type AdminMessage = {
  id: number
  subject: string
  message: string
  message_type: string
  recipient_count?: number
  created_at?: string
}

export type InboxMessage = {
  id: number
  message?: number
  message_subject?: string
  message_content?: string
  message_type?: string
  action_url?: string | null
  action_label?: string | null
  created_at?: string
  is_read?: boolean
  is_archived?: boolean
  delivered_at?: string
  read_at?: string | null
  sender_name?: string
  sender?: {
    id: number
    email?: string
    first_name?: string
    last_name?: string
  }
}

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function createAdminMessage(payload: AdminMessagePayload): Promise<AdminMessage> {
  return apiFetch<AdminMessage>(bfgApi.messages(), {
    method: 'POST',
    body: JSON.stringify({
      message_type: 'notification',
      send_email: false,
      send_sms: false,
      send_push: false,
      ...payload
    })
  })
}

export async function sendAdminMessage(messageId: number, recipientIds: number[]): Promise<{ status: string; recipient_count: number }> {
  return apiFetch<{ status: string; recipient_count: number }>(`${bfgApi.messages()}${messageId}/send/`, {
    method: 'POST',
    body: JSON.stringify({ recipient_ids: recipientIds })
  })
}

export async function listInboxMessages(params?: {
  page?: number
  pageSize?: number
}): Promise<PaginatedResponse<InboxMessage>> {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20

  // Customer inbox uses recipients endpoint (workspace + current user scoped)
  const url = `${bfgApi.recipients()}?page=${page}&page_size=${pageSize}`
  return apiFetch<PaginatedResponse<InboxMessage>>(url)
}

export async function markInboxMessageRead(recipientId: number): Promise<InboxMessage> {
  const url = `${bfgApi.recipients()}${recipientId}/mark_read/`
  return apiFetch<InboxMessage>(url, { method: 'POST' })
}

export async function markInboxMessageUnread(recipientId: number): Promise<InboxMessage> {
  const url = `${bfgApi.recipients()}${recipientId}/mark_unread/`
  return apiFetch<InboxMessage>(url, { method: 'POST' })
}

export async function markAllInboxMessagesRead(): Promise<{ status: string; updated_count: number }> {
  const url = `${bfgApi.recipients()}mark_all_read/`
  return apiFetch<{ status: string; updated_count: number }>(url, { method: 'POST' })
}

export async function bulkMarkInboxMessagesRead(messageIds: number[]): Promise<{ status: string; updated_count: number }> {
  const url = `${bfgApi.recipients()}bulk_mark_read/`
  return apiFetch<{ status: string; updated_count: number }>(url, {
    method: 'POST',
    body: JSON.stringify({ message_ids: messageIds })
  })
}

export async function bulkMarkInboxMessagesUnread(messageIds: number[]): Promise<{ status: string; updated_count: number }> {
  const url = `${bfgApi.recipients()}bulk_mark_unread/`
  return apiFetch<{ status: string; updated_count: number }>(url, {
    method: 'POST',
    body: JSON.stringify({ message_ids: messageIds })
  })
}

export async function bulkDeleteInboxMessages(messageIds: number[]): Promise<{ status: string; deleted_count: number }> {
  const url = `${bfgApi.recipients()}bulk_delete/`
  return apiFetch<{ status: string; deleted_count: number }>(url, {
    method: 'POST',
    body: JSON.stringify({ message_ids: messageIds })
  })
}

