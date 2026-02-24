/**
 * CheckoutPage - Re-export from checkout module
 *
 * The checkout page has been refactored into smaller components:
 * - checkout/types.ts - Type definitions
 * - checkout/CheckoutContactSection.tsx - Contact info section
 * - checkout/CheckoutDeliverySection.tsx - Delivery address section
 * - checkout/CheckoutShippingSection.tsx - Shipping method selection
 * - checkout/CheckoutPaymentSection.tsx - Payment gateway & card input
 * - checkout/CheckoutOrderSummary.tsx - Order summary sidebar
 * - checkout/index.tsx - Main checkout page component
 */
export { default } from './checkout'
