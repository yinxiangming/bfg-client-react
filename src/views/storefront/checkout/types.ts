/**
 * Checkout Types
 */

export type CheckoutFormData = {
  email: string
  firstName: string
  lastName: string
  address: string
  apartment: string
  city: string
  state: string
  zip: string
  country: string
  phone: string
  shippingMethod: string
  freightServiceId?: number  // Preferred over shippingMethod
  /** 'pickup' takes the address out of the equation entirely. */
  fulfillmentMethod: 'shipping' | 'pickup'
  pickupPointId?: number
  cardNumber: string
  cardExpiry: string
  cardCvv: string
  cardName: string
  sameAsBilling: boolean
  saveCard: boolean
}

export type FreightService = {
  id: number
  carrier: number
  carrier_name: string
  name: string
  code: string
  description?: string
  base_price: string
  price_per_kg: string
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
  order: number
}

export type UserInfo = {
  email: string
  first_name: string
  last_name: string
  phone?: string
}

export type Address = {
  id: number
  first_name?: string
  last_name?: string
  full_name?: string
  address1?: string
  address2?: string
  address_line1?: string
  address_line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
  phone?: string
  is_default?: boolean
}

export type PaymentGateway = {
  id: number
  name: string
  gateway_type: 'stripe' | 'paypal' | 'bank_transfer' | 'pay_in_store' | 'wechat' | 'alipay' | 'custom'
  display_info: {
    bank_name?: string
    account_name?: string
    account_number?: string
    routing_number?: string
    swift_code?: string
    accepted_methods?: string
    instructions?: string
    publishable_key?: string
    supports_saved_cards?: boolean
    client_id?: string
  }
  /** Empty or absent means the gateway settles shipped and collected orders alike. */
  supported_fulfillment_methods?: string[]
}

/**
 * True when this gateway can settle an order fulfilled this way.
 *
 * Paying at the counter is only possible if the customer comes to the counter, so the
 * option has to disappear the moment the shopper switches back to delivery. The server
 * rejects the mismatch anyway — this is so it never gets offered in the first place.
 */
export function gatewayAllowsFulfillment(
  gateway: PaymentGateway,
  fulfillmentMethod: CheckoutFormData['fulfillmentMethod']
): boolean {
  const allowed = gateway.supported_fulfillment_methods
  return !allowed || allowed.length === 0 || allowed.includes(fulfillmentMethod)
}

/** True when gateway shows an instructions/display panel (not Stripe card form) */
export function hasGatewayDisplayContent(gateway: PaymentGateway | null | undefined): boolean {
  if (!gateway?.display_info || gateway.gateway_type === 'stripe') return false
  const d = gateway.display_info
  return !!(
    (d.instructions != null && d.instructions !== '') ||
    d.accepted_methods ||
    d.bank_name ||
    d.account_name ||
    d.account_number ||
    d.routing_number ||
    d.swift_code
  )
}

/** True when order is placed with "Place order" and then redirect to success (no external payment step) */
export function isPlaceOrderGateway(gateway: PaymentGateway | null | undefined): boolean {
  return hasGatewayDisplayContent(gateway)
}

export type SavedPaymentMethod = {
  id: number
  gateway: number // PaymentGateway ID
  card_brand: string
  card_last4: string
  card_exp_month: number
  card_exp_year: number
  cardholder_name: string
  is_default: boolean
}

export type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  size?: string
  color?: string
}
