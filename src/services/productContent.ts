import { apiFetch, buildApiUrl } from '@/utils/api'

export type ContentPolicy = {
  id: number
  category: number | null
  scope_key: string
  language: string
  slot: 'footer'
  mode: 'own' | 'inherit' | 'off'
  include_descendants: boolean
  text: string
  enabled: boolean
  revision: number
}

export const getContentPolicies = () => apiFetch<ContentPolicy[]>(buildApiUrl('/shop/product-content-policies/', 'v1'))
export const saveContentPolicy = (data: Partial<ContentPolicy>, id?: number) =>
  apiFetch<ContentPolicy>(buildApiUrl(`/shop/product-content-policies/${id ? `${id}/` : ''}`, 'v1'), {
    method: id ? 'PATCH' : 'POST', body: JSON.stringify(data)
  })
