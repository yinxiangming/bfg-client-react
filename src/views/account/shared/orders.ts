/**
 * What a shopper needs to know about an order.
 *
 * The API keeps two statuses apart: the order status follows fulfilment and the
 * payment status follows the money. A shopper wants one answer to "what is
 * happening with my order?" and the next thing they can do about it, so the
 * account pages show a single state derived from both.
 */

export type StorefrontOrderItem = {
  /** The order item id, which a return line refers to. */
  id?: number
  product_name?: string
  variant_name?: string | null
  sku?: string
  quantity?: number
  price?: string | number
  subtotal?: string | number
  image_url?: string | null
}

export type StorefrontAddress = {
  full_name?: string
  phone?: string
  email?: string
  company?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export type StorefrontOrder = {
  id: number
  order_number?: string
  status?: string
  payment_status?: string
  fulfillment_method?: string
  pickup_code?: string | null
  pickup_point?: {
    id: number
    name?: string
    address?: string
    phone?: string
    instructions?: string
  } | null
  customer_note?: string
  consignments?: { id: number; tracking_number: string; carrier_name?: string }[]
  amounts?: {
    subtotal?: string | number
    shipping_cost?: string | number
    tax?: string | number
    discount?: string | number
    total?: string | number
  }
  addresses?: { shipping?: StorefrontAddress | null; billing?: StorefrontAddress | null }
  items?: StorefrontOrderItem[]
  timestamps?: {
    created_at?: string
    updated_at?: string
    paid_at?: string | null
    shipped_at?: string | null
    delivered_at?: string | null
  }
  activities?: { id: number; title?: string; description?: string; time: string; action?: string }[]
  freight_service?: {
    id: number
    name?: string
    carrier_name?: string | null
    estimated_days_min?: number | null
    estimated_days_max?: number | null
  } | null
}

export type OrderState =
  | 'awaiting_payment'
  | 'payment_failed'
  | 'processing'
  | 'shipped'
  | 'ready_for_pickup'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

/** StatusBadge colours. */
export type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'default'

export const ORDER_STATE_TONE: Record<OrderState, BadgeTone> = {
  awaiting_payment: 'warning',
  payment_failed: 'error',
  processing: 'info',
  shipped: 'info',
  ready_for_pickup: 'info',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'default'
}

export const ORDER_STATE_ICON: Record<OrderState, string> = {
  awaiting_payment: 'tabler-credit-card',
  payment_failed: 'tabler-credit-card-off',
  processing: 'tabler-package',
  shipped: 'tabler-truck-delivery',
  ready_for_pickup: 'tabler-building-store',
  delivered: 'tabler-circle-check',
  cancelled: 'tabler-circle-x',
  refunded: 'tabler-receipt-refund'
}

const lower = (value?: string | null) => (value ?? '').toLowerCase()

export function getOrderState(order: Pick<StorefrontOrder, 'status' | 'payment_status'>): OrderState {
  const status = lower(order.status)
  const payment = lower(order.payment_status)

  if (status === 'cancelled') return 'cancelled'
  if (status === 'refunded' || payment === 'refunded') return 'refunded'
  if (status === 'delivered') return 'delivered'
  if (status === 'ready_for_pickup') return 'ready_for_pickup'
  if (status === 'shipped') return 'shipped'
  if (payment === 'failed') return 'payment_failed'
  if (payment !== 'paid') return 'awaiting_payment'

  return 'processing'
}

/** Unpaid, and not given up on. A shipped cash-on-delivery order can still be paid here. */
export const needsPayment = (order: Pick<StorefrontOrder, 'status' | 'payment_status'>) =>
  ['pending', 'failed'].includes(lower(order.payment_status)) && !['cancelled', 'refunded'].includes(lower(order.status))

/** Before anything has left the shop. The server has the final say. */
export const canCancel = (order: Pick<StorefrontOrder, 'status'>) => ['pending', 'processing'].includes(lower(order.status))

export const canReturn = (order: Pick<StorefrontOrder, 'status'>) => lower(order.status) === 'delivered'

export const isPickupOrder = (order: Pick<StorefrontOrder, 'fulfillment_method'>) =>
  lower(order.fulfillment_method) === 'pickup'

export const unitCount = (order: Pick<StorefrontOrder, 'items'>) =>
  (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0)

export const trackingNumbers = (order: Pick<StorefrontOrder, 'consignments'>) =>
  (order.consignments ?? []).filter(consignment => Boolean(consignment.tracking_number))

/** The postal lines of an address, blanks dropped. */
export const addressLines = (address?: StorefrontAddress | null) => {
  if (!address) return []

  const locality = [address.city, address.state, address.postal_code].filter(Boolean).join(' ')

  return [address.company, address.address_line1, address.address_line2, locality, address.country].filter(
    (line): line is string => Boolean(line && line.trim())
  )
}
