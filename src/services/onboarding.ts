// Setup wizard API (BFG2 common module).
//
// The checklist is defined server-side (bfg/common/onboarding/checklist.py) and
// serialised whole — the wizard renders whatever it is sent rather than keeping
// a second copy of "what counts as set up" in the client.

import { apiFetch, bfgApi } from '@/utils/api'
import { getSiteAdminOptions } from '@/services/settings'

export type ChecklistItem = {
  key: string
  label: string
  label_zh: string
  hint: string
  hint_zh: string
  /** Admin route this item is fixed on, including its `?tab=`. */
  href: string
  required: boolean
  /** True when applying a country/industry template fills this in. */
  from_template: boolean
  done: boolean
  skipped: boolean
  /** What the setting is currently set to. Empty until the row is done. */
  value: string
  value_zh: string
}

export type ChecklistStep = {
  key: string
  title: string
  title_zh: string
  description: string
  description_zh: string
  icon: string
  /** One-line digest of this step's values, so a collapsed step still says something. */
  summary: string
  summary_zh: string
  percent: number
  done_count: number
  total_count: number
  complete: boolean
  items: ChecklistItem[]
}

export type OnboardingState = {
  country: string
  industry: string
  applied_at: string
  dismissed: boolean
  skipped: string[]
}

export type OnboardingStatus = {
  /** Required items only — the number the progress bar shows. */
  percent: number
  required_done: number
  required_total: number
  optional_done: number
  optional_total: number
  complete: boolean
  steps: ChecklistStep[]
  state: OnboardingState
}

export type CountryOption = {
  code: string
  name: string
  name_zh: string
  currency: string
  timezone: string
  default_language: string
  languages: string[]
  tax: { name: string; rate: string; note: string; note_zh: string }
}

export type IndustryOption = {
  key: string
  name: string
  name_zh: string
  icon: string
  description: string
  description_zh: string
}

export type OnboardingOptions = {
  countries: CountryOption[]
  industries: IndustryOption[]
  languages: string[]
  defaults: { country: string; industry: string }
}

export type TemplateChange = {
  /** `create` — will be written. `update` — an existing value changes. `keep` — left alone. */
  action: 'create' | 'update' | 'keep'
  kind: string
  key: string
  label: string
}

export type TemplatePreview = {
  country: { code: string; name: string; name_zh: string }
  industry: { key: string; name: string; name_zh: string }
  settings: {
    country: string
    default_currency: string
    default_language: string
    supported_languages: string[]
    default_timezone: string
    site_name: string
  }
  tax: { name: string; rate: string; note: string; note_zh: string }
  changes: TemplateChange[]
}

export type ApplyResult = {
  country: { code: string; name: string; name_zh: string }
  industry: { key: string; name: string; name_zh: string }
  changes: TemplateChange[]
  status: OnboardingStatus
}

export type TemplateOverrides = {
  site_name?: string
  contact_email?: string
  contact_phone?: string
  currency?: string
  timezone?: string
  default_language?: string
  languages?: string[]
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>(bfgApi.onboardingStatus(), getSiteAdminOptions())
}

export async function getOnboardingOptions(): Promise<OnboardingOptions> {
  return apiFetch<OnboardingOptions>(bfgApi.onboardingOptions(), getSiteAdminOptions())
}

export async function previewTemplate(
  country: string,
  industry: string,
  overrides: TemplateOverrides = {}
): Promise<TemplatePreview> {
  return apiFetch<TemplatePreview>(bfgApi.onboardingPreview(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({ country, industry, overrides })
  })
}

export async function applyTemplate(
  country: string,
  industry: string,
  overrides: TemplateOverrides = {}
): Promise<ApplyResult> {
  return apiFetch<ApplyResult>(bfgApi.onboardingApply(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({ country, industry, overrides })
  })
}

export async function setItemSkipped(item: string, skipped: boolean): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>(bfgApi.onboardingSkip(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({ item, skipped })
  })
}

export async function dismissOnboarding(dismissed = true): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>(bfgApi.onboardingDismiss(), {
    ...getSiteAdminOptions(),
    method: 'POST',
    body: JSON.stringify({ dismissed })
  })
}

/** Pick the caller's language out of the paired `x` / `x_zh` fields the API sends. */
export function localised<T extends Record<string, any>>(item: T, field: string, locale: string): string {
  if (locale.startsWith('zh')) return item[`${field}_zh`] || item[field] || ''

  return item[field] || ''
}
