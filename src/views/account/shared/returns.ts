import type { BadgeTone } from './orders'

export type ReturnStatus = 'open' | 'approved' | 'rejected' | 'received' | 'inspected' | 'refunded' | 'closed' | 'cancelled'

export type CustomerReturnItem = {
  id: number
  order_item: number
  product_name?: string
  product_price?: string | number
  quantity: number
  reason?: string
}

export type CustomerReturn = {
  id: number
  order: number
  order_number?: string
  return_number: string
  status: ReturnStatus
  reason_category?: string
  customer_note?: string
  items?: CustomerReturnItem[]
  created_at?: string
  approved_at?: string | null
  refunded_at?: string | null
  closed_at?: string | null
}

export const RETURN_STATE_TONE: Record<ReturnStatus, BadgeTone> = {
  open: 'warning',
  approved: 'info',
  received: 'info',
  inspected: 'info',
  refunded: 'success',
  rejected: 'error',
  closed: 'default',
  cancelled: 'default'
}

/** Reason codes a customer picks from. Stored in `reason_category`; labels live in the messages. */
export const RETURN_REASONS = ['faulty', 'damaged', 'wrong_item', 'not_as_described', 'changed_mind', 'other'] as const

export type ReturnReason = (typeof RETURN_REASONS)[number]

/** Still moving: the shop has something left to do. */
export const isActiveReturn = (item: Pick<CustomerReturn, 'status'>) =>
  ['open', 'approved', 'received', 'inspected'].includes(item.status)

export const returnUnits = (item: Pick<CustomerReturn, 'items'>) =>
  (item.items ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0)

/** What the lines are worth at the price paid. The shop decides the actual refund. */
export const returnValue = (item: Pick<CustomerReturn, 'items'>) =>
  (item.items ?? []).reduce((sum, line) => sum + Number(line.product_price ?? 0) * (line.quantity ?? 0), 0)
