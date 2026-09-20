/**
 * Per-workspace social-login credentials (Google, Facebook, Apple).
 *
 * Each shop registers its own OAuth client with the provider: the provider ties
 * that client to the shop's own domains and puts its owner's name on the consent
 * screen, so credentials cannot be shared across workspaces the way a server
 * setting can.
 */
import { apiFetch, bfgApi } from '@/utils/api'

export type SocialAuthProvider = 'google' | 'facebook' | 'apple'

/** Sent back untouched when the admin never typed a new secret. */
export const SECRET_MASK = '********'

export type SocialAuthConfig = {
  id: number
  provider: SocialAuthProvider
  provider_display: string
  client_id: string
  /** Masked on read; send {@link SECRET_MASK} back to keep the stored value. */
  secret: string
  /** Apple's key id. Unused by Google and Facebook. */
  key: string
  /** Apple's .p8 signing key is write-only, so only its presence is readable. */
  has_certificate_key: boolean
  is_active: boolean
  is_configured: boolean
  created_at?: string
  updated_at?: string
}

export type SocialAuthConfigPayload = {
  provider?: SocialAuthProvider
  client_id?: string
  secret?: string
  key?: string
  certificate_key?: string
  is_active?: boolean
}

/** What the provider's own console needs, spelled out so it can be pasted. */
export type SocialAuthProviderInfo = {
  id: SocialAuthProvider
  label: string
  required_fields: string[]
  redirect_uri: string
  javascript_origins: string[]
  /** The platform operator offers a shared client for this provider. */
  platform_default_available: boolean
  /** This shop is currently signing visitors in with that shared client. */
  inherited_from_platform: boolean
}

const baseUrl = () => bfgApi.socialAuthConfigs()

export async function listSocialAuthConfigs(): Promise<SocialAuthConfig[]> {
  const res = await apiFetch<{ results: SocialAuthConfig[] } | SocialAuthConfig[]>(baseUrl())
  if (Array.isArray(res)) return res
  return res?.results ?? []
}

export async function createSocialAuthConfig(payload: SocialAuthConfigPayload): Promise<SocialAuthConfig> {
  return apiFetch<SocialAuthConfig>(baseUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export async function updateSocialAuthConfig(
  id: number,
  payload: SocialAuthConfigPayload
): Promise<SocialAuthConfig> {
  return apiFetch<SocialAuthConfig>(`${baseUrl()}${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

export async function deleteSocialAuthConfig(id: number): Promise<void> {
  await apiFetch(`${baseUrl()}${id}/`, { method: 'DELETE' })
}

export async function getSocialAuthProviders(): Promise<SocialAuthProviderInfo[]> {
  return apiFetch<SocialAuthProviderInfo[]>(`${baseUrl()}providers/`)
}
