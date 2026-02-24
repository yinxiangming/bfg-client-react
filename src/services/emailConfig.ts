/**
 * Email config API (workspace-level email backends: SMTP, Mailgun).
 */
import { apiFetch } from '@/utils/api'
import { bfgApi } from '@/utils/api'

export type EmailConfigBackendType = 'smtp' | 'mailgun'

export type EmailConfigSmtp = {
  host: string
  port: number
  use_tls?: boolean
  use_ssl?: boolean
  user?: string
  password?: string
  from_email: string
}

export type EmailConfigMailgun = {
  api_key: string
  domain: string
  from_email: string
  region?: string
}

export type EmailConfigPayload = {
  name: string
  backend_type: EmailConfigBackendType
  config: EmailConfigSmtp | EmailConfigMailgun
  is_active?: boolean
  is_default?: boolean
}

export type EmailConfig = {
  id: number
  name: string
  backend_type: EmailConfigBackendType
  config: EmailConfigSmtp | EmailConfigMailgun
  is_active: boolean
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export type BackendTypeInfo = {
  id: string
  label: string
  config_schema: Record<string, { type: string; required?: boolean; default?: unknown }>
}

const baseUrl = () => bfgApi.emailConfigs()

export async function listEmailConfigs(): Promise<EmailConfig[]> {
  const res = await apiFetch<{ results: EmailConfig[] } | EmailConfig[]>(baseUrl())
  if (Array.isArray(res)) return res
  if (res?.results) return res.results
  return []
}

export async function getEmailConfig(id: number): Promise<EmailConfig> {
  const url = `${baseUrl()}${id}/`
  return apiFetch<EmailConfig>(url)
}

export async function createEmailConfig(payload: EmailConfigPayload): Promise<EmailConfig> {
  const res = await apiFetch<EmailConfig>(baseUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res
}

export async function updateEmailConfig(id: number, payload: Partial<EmailConfigPayload>): Promise<EmailConfig> {
  const url = `${baseUrl()}${id}/`
  return apiFetch<EmailConfig>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export async function deleteEmailConfig(id: number): Promise<void> {
  const url = `${baseUrl()}${id}/`
  await apiFetch(url, { method: 'DELETE' })
}

export async function setDefaultEmailConfig(id: number): Promise<EmailConfig> {
  const url = `${baseUrl()}${id}/set_default/`
  return apiFetch<EmailConfig>(url, { method: 'POST' })
}

export async function sendTestEmail(id: number, to: string): Promise<{ detail: string }> {
  const url = `${baseUrl()}${id}/send_test/`
  return apiFetch<{ detail: string }>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to })
  })
}

export async function getEmailConfigBackendTypes(): Promise<BackendTypeInfo[]> {
  const url = `${baseUrl()}backend_types/`
  return apiFetch<BackendTypeInfo[]>(url)
}
