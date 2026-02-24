// Message Template API service

import { apiFetch, bfgApi } from '@/utils/api'

export interface MessageTemplate {
  id: number
  name: string
  code: string
  event: string
  language: string
  email_enabled: boolean
  email_subject: string
  email_body: string
  email_html_body?: string
  app_message_enabled: boolean
  app_message_title: string
  app_message_body: string
  sms_enabled: boolean
  sms_body: string
  push_enabled: boolean
  push_title: string
  push_body: string
  available_variables?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface MessageTemplatePayload {
  name: string
  code: string
  event: string
  language: string
  email_enabled: boolean
  email_subject?: string
  email_body?: string
  email_html_body?: string
  app_message_enabled: boolean
  app_message_title?: string
  app_message_body?: string
  sms_enabled: boolean
  sms_body?: string
  push_enabled: boolean
  push_title?: string
  push_body?: string
  available_variables?: Record<string, any>
  is_active: boolean
}

// Message Templates API
export async function getMessageTemplates(language?: string): Promise<MessageTemplate[]> {
  const url = language 
    ? `${bfgApi.messageTemplates()}?language=${language}`
    : bfgApi.messageTemplates()
  const response = await apiFetch<MessageTemplate[] | { results: MessageTemplate[]; data?: MessageTemplate[] }>(url)
  if (Array.isArray(response)) {
    return response
  }
  return response.results || response.data || []
}

export async function getMessageTemplate(id: number): Promise<MessageTemplate> {
  return apiFetch<MessageTemplate>(`${bfgApi.messageTemplates()}${id}/`)
}

export async function createMessageTemplate(data: MessageTemplatePayload): Promise<MessageTemplate> {
  return apiFetch<MessageTemplate>(bfgApi.messageTemplates(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateMessageTemplate(id: number, data: Partial<MessageTemplatePayload>): Promise<MessageTemplate> {
  return apiFetch<MessageTemplate>(`${bfgApi.messageTemplates()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteMessageTemplate(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.messageTemplates()}${id}/`, {
    method: 'DELETE'
  })
}
