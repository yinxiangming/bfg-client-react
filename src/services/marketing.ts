// Marketing API service (BFG2 Marketing module)

import { apiFetch, bfgApi } from '@/utils/api'

export type Campaign = {
  id: number
  name: string
  campaign_type: string
  description?: string
  start_date: string
  end_date?: string
  budget?: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CampaignPayload = Omit<Campaign, 'id' | 'created_at' | 'updated_at'>

export type Coupon = {
  id: number
  code: string
  description?: string
  usage_limit?: number
  usage_limit_per_customer?: number
  times_used?: number
  valid_from: string
  valid_until?: string
  is_active: boolean
  campaign_id?: number
  discount_rule_id: number
  created_at?: string
  updated_at?: string
}

export type CouponPayload = Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'times_used'>

export type GiftCard = {
  id: number
  code: string
  initial_value: number
  balance: number
  currency: number
  currency_code?: string
  customer?: number
  customer_name?: string
  is_active: boolean
  expires_at?: string
  created_at?: string
  updated_at?: string
}

export type GiftCardPayload = Omit<GiftCard, 'id' | 'code' | 'created_at' | 'updated_at' | 'balance' | 'currency_code' | 'customer_name'>

export type ReferralProgram = {
  id: number
  name: string
  description?: string
  referrer_reward: number
  referee_reward: number
  minimum_purchase?: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type ReferralProgramPayload = Omit<ReferralProgram, 'id' | 'created_at' | 'updated_at'>

// Campaign API
export async function getCampaigns(): Promise<Campaign[]> {
  const response = await apiFetch<Campaign[] | { results: Campaign[] }>(bfgApi.campaigns())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getCampaign(id: number): Promise<Campaign> {
  return apiFetch<Campaign>(`${bfgApi.campaigns()}${id}/`)
}

export async function createCampaign(data: CampaignPayload) {
  return apiFetch<Campaign>(bfgApi.campaigns(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCampaign(id: number, data: Partial<CampaignPayload>) {
  return apiFetch<Campaign>(`${bfgApi.campaigns()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteCampaign(id: number) {
  return apiFetch<void>(`${bfgApi.campaigns()}${id}/`, {
    method: 'DELETE'
  })
}

// Coupon API
export async function getCoupons(): Promise<Coupon[]> {
  const response = await apiFetch<Coupon[] | { results: Coupon[] }>(bfgApi.coupons())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getCoupon(id: number): Promise<Coupon> {
  return apiFetch<Coupon>(`${bfgApi.coupons()}${id}/`)
}

export async function createCoupon(data: CouponPayload) {
  return apiFetch<Coupon>(bfgApi.coupons(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCoupon(id: number, data: Partial<CouponPayload>) {
  return apiFetch<Coupon>(`${bfgApi.coupons()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteCoupon(id: number) {
  return apiFetch<void>(`${bfgApi.coupons()}${id}/`, {
    method: 'DELETE'
  })
}

// Gift Card API
export async function getGiftCards(): Promise<GiftCard[]> {
  const response = await apiFetch<GiftCard[] | { results: GiftCard[] }>(bfgApi.giftCards())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getGiftCard(id: number): Promise<GiftCard> {
  return apiFetch<GiftCard>(`${bfgApi.giftCards()}${id}/`)
}

export async function createGiftCard(data: GiftCardPayload) {
  return apiFetch<GiftCard>(bfgApi.giftCards(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateGiftCard(id: number, data: Partial<GiftCardPayload>) {
  return apiFetch<GiftCard>(`${bfgApi.giftCards()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteGiftCard(id: number) {
  return apiFetch<void>(`${bfgApi.giftCards()}${id}/`, {
    method: 'DELETE'
  })
}

export async function deactivateGiftCard(id: number) {
  return apiFetch<GiftCard>(`${bfgApi.giftCards()}${id}/deactivate/`, {
    method: 'POST'
  })
}

// Referral Program API
export async function getReferralPrograms(): Promise<ReferralProgram[]> {
  const response = await apiFetch<ReferralProgram[] | { results: ReferralProgram[] }>(bfgApi.referralPrograms())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getReferralProgram(id: number): Promise<ReferralProgram> {
  return apiFetch<ReferralProgram>(`${bfgApi.referralPrograms()}${id}/`)
}

export async function createReferralProgram(data: ReferralProgramPayload) {
  return apiFetch<ReferralProgram>(bfgApi.referralPrograms(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateReferralProgram(id: number, data: Partial<ReferralProgramPayload>) {
  return apiFetch<ReferralProgram>(`${bfgApi.referralPrograms()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteReferralProgram(id: number) {
  return apiFetch<void>(`${bfgApi.referralPrograms()}${id}/`, {
    method: 'DELETE'
  })
}

// Same as ProductCategory.rules (CategoryRuleModel: column, relation, condition)
export type CategoryRule = { column: string; relation: string; condition: string }

// CampaignDisplay (promo: slides, featured categories, featured posts); campaign optional; rules reuse CategoryRuleModel
export type CampaignDisplay = {
  id: number
  workspace?: number | null
  campaign: number | null
  campaign_name?: string | null
  display_type: 'slide' | 'category_entry' | 'featured'
  order: number
  title?: string
  subtitle?: string
  image?: string | null
  link_url?: string
  link_target?: string
  rules?: CategoryRule[]
  post?: number | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CampaignDisplayPayload = Omit<CampaignDisplay, 'id' | 'campaign_name' | 'created_at' | 'updated_at'>

export async function getCampaignDisplays(): Promise<CampaignDisplay[]> {
  const response = await apiFetch<CampaignDisplay[] | { results: CampaignDisplay[] }>(bfgApi.campaignDisplays())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getCampaignDisplay(id: number): Promise<CampaignDisplay> {
  return apiFetch<CampaignDisplay>(`${bfgApi.campaignDisplays()}${id}/`)
}

/** Convert base64 data URL to File for multipart upload. */
function dataUrlToFile(dataUrl: string, filename = 'image.jpg'): File {
  const [head, base64] = dataUrl.split(',')
  const mime = head?.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
  const ext = mime.split('/')[1] || 'jpg'
  const name = filename.replace(/\.[^.]+$/, '') + '.' + ext
  const bin = atob(base64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], name, { type: mime })
}

function isDataUrl(s: unknown): s is string {
  return typeof s === 'string' && s.startsWith('data:')
}

function buildCampaignDisplayFormData(data: CampaignDisplayPayload | Partial<CampaignDisplayPayload>): FormData {
  const form = new FormData()
  if (isDataUrl(data.image)) {
    form.append('image', dataUrlToFile(data.image))
  }
  const str = (v: unknown) => (v == null ? '' : String(v))
  if (data.campaign != null) form.append('campaign', str(data.campaign))
  if (data.workspace != null) form.append('workspace', str(data.workspace))
  form.append('display_type', str(data.display_type))
  form.append('order', str(data.order))
  form.append('title', str(data.title ?? ''))
  form.append('subtitle', str(data.subtitle ?? ''))
  form.append('link_url', str(data.link_url ?? ''))
  form.append('link_target', str(data.link_target ?? '_self'))
  if (Array.isArray(data.rules)) form.append('rules', JSON.stringify(data.rules))
  form.append('post', data.post != null ? str(data.post) : '')
  form.append('is_active', data.is_active !== false ? 'true' : 'false')
  return form
}

export async function createCampaignDisplay(data: CampaignDisplayPayload) {
  if (isDataUrl(data.image)) {
    return apiFetch<CampaignDisplay>(bfgApi.campaignDisplays(), {
      method: 'POST',
      body: buildCampaignDisplayFormData(data)
    })
  }
  return apiFetch<CampaignDisplay>(bfgApi.campaignDisplays(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCampaignDisplay(id: number, data: Partial<CampaignDisplayPayload>) {
  if (isDataUrl(data.image)) {
    return apiFetch<CampaignDisplay>(`${bfgApi.campaignDisplays()}${id}/`, {
      method: 'PATCH',
      body: buildCampaignDisplayFormData(data)
    })
  }
  return apiFetch<CampaignDisplay>(`${bfgApi.campaignDisplays()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteCampaignDisplay(id: number) {
  return apiFetch<void>(`${bfgApi.campaignDisplays()}${id}/`, {
    method: 'DELETE'
  })
}

