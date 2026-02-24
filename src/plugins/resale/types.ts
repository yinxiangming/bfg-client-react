// Resale plugin types

export interface ResaleSettings {
  id: number
  enabled: boolean
  commission_rate: number
  max_products_per_customer: number
  default_listing_days: number
  terms_and_conditions: string
  created_at?: string
  updated_at?: string
}

export type ResaleProductStatus = 'pending' | 'active' | 'sold' | 'returned' | 'expired'

export interface ResaleProduct {
  id: number
  workspace: number
  product: number
  customer: number
  booking?: number | null
  commission_rate: number
  status: ResaleProductStatus
  listing_start_date: string
  listing_end_date?: string | null
  sold_at?: string | null
  sold_order_item?: number | null
  created_at?: string
  updated_at?: string
  /** Product name from API (for list display) */
  product_name?: string | null
  /** Product primary image URL from API */
  product_image?: string | null
  /** Product price string from API */
  price?: string | null
  /** Commission amount (price * commission_rate%) string from API */
  commission_amount?: string | null
  /** Product stock quantity from API */
  stock_quantity?: number | null
  /** Customer display name from API */
  customer_name?: string | null
  /** Quantity sold (from order item) when status is sold */
  sold_quantity?: number | null
}

export type ResalePayoutStatus = 'pending' | 'paid' | 'failed'

export interface ResalePayoutItem {
  id: number
  payout: number
  resale_product: number
  order_item: number
  /** Product ID for admin product link */
  product_id?: number | null
  /** Product name from API */
  product_name?: string | null
  /** Order ID for admin order link */
  order_id?: number | null
  sale_price: number | string
  commission_rate: number | string
  payout_amount: number | string
  created_at?: string
}

export interface ResalePayout {
  id: number
  workspace: number
  customer: number
  total_amount: number
  status: ResalePayoutStatus
  payment_method?: string
  payment_reference?: string
  notes?: string
  created_at?: string
  paid_at?: string | null
  items?: ResalePayoutItem[]
  /** Customer display name from API */
  customer_name?: string | null
  /** Customer preferred way to receive payout (from ResaleCustomerPreference) */
  customer_preferred_payout_method?: string | null
  customer_payout_method_notes?: string | null
}

export interface ResaleCustomerPreference {
  id: number
  workspace: number
  customer: number
  preferred_payout_method: string
  payout_method_notes: string
  created_at?: string
  updated_at?: string
}

// Booking types (from web module)
export type BookingSlotType = 'dropoff' | 'pickup' | 'appointment' | 'reservation' | 'consultation'

export interface BookingTimeSlot {
  id: number
  workspace: number
  site?: number | null
  slot_type: BookingSlotType
  name?: string
  date: string
  start_time: string
  end_time: string
  max_bookings: number
  current_bookings: number
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Booking {
  id: number
  workspace: number
  timeslot: number
  customer?: number | null
  name?: string
  email?: string
  phone?: string
  status: BookingStatus
  notes?: string
  admin_notes?: string
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
  // Derived fields
  slot_type?: BookingSlotType
  slot_date?: string
  slot_start_time?: string
  slot_end_time?: string
}
