// Finance API service (BFG2 Finance module)

import { apiFetch, bfgApi, getApiBaseUrl, getWorkspaceId } from '@/utils/api'

export type Currency = {
  id: number
  code: string
  name: string
  symbol: string
  decimal_places: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type CurrencyPayload = Omit<Currency, 'id' | 'created_at' | 'updated_at'>

export type PaymentGatewayPluginInfo = {
  gateway_type: string
  display_name: string
  supported_methods: string[]
  config_schema: Record<string, { type: string; required?: boolean; sensitive?: boolean; description?: string }>
}

export type PaymentGateway = {
  id: number
  name: string
  gateway_type: string
  config: Record<string, any>
  test_config: Record<string, any>
  is_active: boolean
  is_test_mode: boolean
  created_at?: string
  updated_at?: string
}

export type PaymentGatewayPayload = Omit<PaymentGateway, 'id' | 'created_at' | 'updated_at'>

export type TaxRate = {
  id: number
  name: string
  rate: number
  country: string
  state: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type TaxRatePayload = Omit<TaxRate, 'id' | 'created_at' | 'updated_at'>

export type Brand = {
  id: number
  name: string
  logo?: string
  address_id?: number
  tax_id?: string
  registration_number?: string
  invoice_note?: string
  is_default: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type BrandPayload = Omit<Brand, 'id' | 'created_at' | 'updated_at' | 'logo'> & {
  logo?: string | File
}

export type FinancialCode = {
  id: number
  code: string
  name: string
  description?: string
  unit_price?: string | number | null
  unit?: string
  tax_type: 'default' | 'no_tax' | 'zero_gst'
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type FinancialCodePayload = Omit<FinancialCode, 'id' | 'created_at' | 'updated_at'>

export type InvoiceSetting = {
  id: number
  invoice_prefix: string
  default_due_days: number
  default_footer: string
  enable_auto_number: boolean
  email_template_id?: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type InvoiceSettingPayload = Omit<InvoiceSetting, 'id' | 'created_at' | 'updated_at'>

// Currency API
export async function getCurrencies(): Promise<Currency[]> {
  const response = await apiFetch<Currency[] | { results: Currency[] }>(bfgApi.currencies())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getCurrency(id: number): Promise<Currency> {
  return apiFetch<Currency>(`${bfgApi.currencies()}${id}/`)
}

export async function createCurrency(data: CurrencyPayload) {
  return apiFetch<Currency>(bfgApi.currencies(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateCurrency(id: number, data: Partial<CurrencyPayload>) {
  return apiFetch<Currency>(`${bfgApi.currencies()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteCurrency(id: number) {
  return apiFetch<void>(`${bfgApi.currencies()}${id}/`, {
    method: 'DELETE'
  })
}

// Payment Gateway API
export async function getPaymentGateways(): Promise<PaymentGateway[]> {
  const response = await apiFetch<PaymentGateway[] | { results: PaymentGateway[] }>(bfgApi.paymentGateways())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getPaymentGateway(id: number): Promise<PaymentGateway> {
  return apiFetch<PaymentGateway>(`${bfgApi.paymentGateways()}${id}/`)
}

export async function createPaymentGateway(data: PaymentGatewayPayload) {
  return apiFetch<PaymentGateway>(bfgApi.paymentGateways(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updatePaymentGateway(id: number, data: Partial<PaymentGatewayPayload>) {
  return apiFetch<PaymentGateway>(`${bfgApi.paymentGateways()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deletePaymentGateway(id: number) {
  return apiFetch<void>(`${bfgApi.paymentGateways()}${id}/`, {
    method: 'DELETE'
  })
}

export async function getPaymentGatewayPlugins(): Promise<PaymentGatewayPluginInfo[]> {
  return apiFetch<PaymentGatewayPluginInfo[]>(bfgApi.paymentGatewayPlugins())
}

// Tax Rate API
export async function getTaxRates(): Promise<TaxRate[]> {
  const response = await apiFetch<TaxRate[] | { results: TaxRate[] }>(bfgApi.taxRates())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getTaxRate(id: number): Promise<TaxRate> {
  return apiFetch<TaxRate>(`${bfgApi.taxRates()}${id}/`)
}

export async function createTaxRate(data: TaxRatePayload) {
  return apiFetch<TaxRate>(bfgApi.taxRates(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateTaxRate(id: number, data: Partial<TaxRatePayload>) {
  return apiFetch<TaxRate>(`${bfgApi.taxRates()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteTaxRate(id: number) {
  return apiFetch<void>(`${bfgApi.taxRates()}${id}/`, {
    method: 'DELETE'
  })
}

// Brand API
export async function getBrands(): Promise<Brand[]> {
  const response = await apiFetch<Brand[] | { results: Brand[] }>(bfgApi.brands())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getBrand(id: number): Promise<Brand> {
  return apiFetch<Brand>(`${bfgApi.brands()}${id}/`)
}

export async function createBrand(data: BrandPayload) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const maybeFile: any = value
      if (key === 'logo' && maybeFile instanceof File) {
        formData.append(key, maybeFile)
      } else {
        formData.append(key, String(value))
      }
    }
  })
  return apiFetch<Brand>(bfgApi.brands(), {
    method: 'POST',
    body: formData
  })
}

export async function updateBrand(id: number, data: Partial<BrandPayload>) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const maybeFile: any = value
      if (key === 'logo' && maybeFile instanceof File) {
        formData.append(key, maybeFile)
      } else {
        formData.append(key, String(value))
      }
    }
  })
  return apiFetch<Brand>(`${bfgApi.brands()}${id}/`, {
    method: 'PATCH',
    body: formData
  })
}

export async function deleteBrand(id: number) {
  return apiFetch<void>(`${bfgApi.brands()}${id}/`, {
    method: 'DELETE'
  })
}

// Financial Code API
export async function getFinancialCodes(): Promise<FinancialCode[]> {
  const response = await apiFetch<FinancialCode[] | { results: FinancialCode[] }>(bfgApi.financialCodes())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getFinancialCode(id: number): Promise<FinancialCode> {
  return apiFetch<FinancialCode>(`${bfgApi.financialCodes()}${id}/`)
}

export async function createFinancialCode(data: FinancialCodePayload) {
  return apiFetch<FinancialCode>(bfgApi.financialCodes(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateFinancialCode(id: number, data: Partial<FinancialCodePayload>) {
  return apiFetch<FinancialCode>(`${bfgApi.financialCodes()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteFinancialCode(id: number) {
  return apiFetch<void>(`${bfgApi.financialCodes()}${id}/`, {
    method: 'DELETE'
  })
}

// Invoice Setting API
export async function getInvoiceSettings(): Promise<InvoiceSetting[]> {
  const response = await apiFetch<InvoiceSetting[] | { results: InvoiceSetting[] }>(bfgApi.invoiceSettings())
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getInvoiceSetting(id: number): Promise<InvoiceSetting> {
  return apiFetch<InvoiceSetting>(`${bfgApi.invoiceSettings()}${id}/`)
}

export async function createInvoiceSetting(data: InvoiceSettingPayload) {
  return apiFetch<InvoiceSetting>(bfgApi.invoiceSettings(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateInvoiceSetting(id: number, data: Partial<InvoiceSettingPayload>) {
  return apiFetch<InvoiceSetting>(`${bfgApi.invoiceSettings()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteInvoiceSetting(id: number) {
  return apiFetch<void>(`${bfgApi.invoiceSettings()}${id}/`, {
    method: 'DELETE'
  })
}

// Invoice types
export type Invoice = {
  id: number
  invoice_number: string
  customer: number
  order?: number | null
  brand?: number | { id: number; name: string } | null
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal: string | number
  tax: string | number
  total: string | number
  currency: number | { id: number; code: string; symbol: string }
  issue_date: string
  due_date?: string | null
  paid_date?: string | null
  sent_date?: string | null  // Date when invoice was sent (not a status)
  notes?: string
  items?: Array<{
    id: number
    description: string
    quantity: number
    unit_price: string | number
    subtotal: string | number
    tax: string | number
    total: string | number
    financial_code?: number | { id: number; code: string; name: string; tax_type: 'default' | 'no_tax' | 'zero_gst' } | null
  }>
  created_at?: string
}

export type InvoiceCreatePayload = {
  customer: number
  order?: number
  currency?: number
  brand?: number
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date?: string
  notes?: string
  items: Array<{
    description: string
    quantity: number
    unit_price: string | number
    financial_code_id?: number
    tax_type?: 'default' | 'no_tax' | 'zero_gst'
    tax_rate?: number
  }>
}

// Invoice API
export async function getInvoices(params?: { order?: number }): Promise<Invoice[]> {
  const queryParams = new URLSearchParams()
  if (params?.order) {
    queryParams.append('order', params.order.toString())
  }
  const url = `${bfgApi.invoices()}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await apiFetch<Invoice[] | { results: Invoice[] }>(url)
  if (Array.isArray(response)) return response
  return response.results || []
}

export async function getInvoice(id: number): Promise<Invoice> {
  return apiFetch<Invoice>(`${bfgApi.invoices()}${id}/`)
}

export async function createInvoice(data: InvoiceCreatePayload): Promise<Invoice> {
  return apiFetch<Invoice>(bfgApi.invoices(), {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateInvoice(id: number, data: Partial<InvoiceCreatePayload>): Promise<Invoice> {
  return apiFetch<Invoice>(`${bfgApi.invoices()}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function updateInvoiceItems(id: number, items: InvoiceCreatePayload['items']): Promise<Invoice> {
  return apiFetch<Invoice>(`${bfgApi.invoices()}${id}/update_items/`, {
    method: 'POST',
    body: JSON.stringify({ items })
  })
}

export async function deleteInvoice(id: number): Promise<void> {
  return apiFetch<void>(`${bfgApi.invoices()}${id}/`, {
    method: 'DELETE'
  })
}

export async function sendInvoice(id: number): Promise<{ status?: string; message?: string; [key: string]: any }> {
  return apiFetch<{ status?: string; message?: string; [key: string]: any }>(`${bfgApi.invoices()}${id}/send/`, {
    method: 'POST'
  })
}

export async function downloadInvoice(id: number): Promise<Blob> {
  // Use apiFetch helper but handle blob response
  const API_BASE_URL = getApiBaseUrl()
  const url = `${API_BASE_URL}/api/v1/invoices/${id}/download_pdf/`
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const workspaceId = getWorkspaceId()

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (workspaceId) headers['X-Workspace-ID'] = workspaceId

  const response = await fetch(url, {
    method: 'GET',
    headers
  })

  if (!response.ok) {
    let errorDetail = 'Failed to download invoice'
    try {
      const errorData = await response.json()
      errorDetail = errorData.detail || errorData.message || errorDetail
    } catch {
      errorDetail = await response.text() || errorDetail
    }
    throw new Error(errorDetail)
  }

  return response.blob()
}
