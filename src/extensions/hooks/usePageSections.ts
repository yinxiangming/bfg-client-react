import { useMemo } from 'react'
import { useExtensions } from '../context'
import { getTargetSlot, type PageSlotExtension } from '../registry'

// Default slot IDs per page (for hide/replace detection). Canonical name: DEFAULT_SLOTS.
export const DEFAULT_SLOTS: Record<string, string[]> = {
  // Admin - Store
  'admin/store/products/edit': [
    'ProductInformation', 'ProductImage', 'ProductDescription',
    'ProductVariants', 'ProductPricing', 'ProductInventory', 'ProductOrganize'
  ],
  'admin/store/products/add': [
    'ProductInformation', 'ProductImage', 'ProductDescription',
    'ProductVariants', 'ProductPricing', 'ProductInventory', 'ProductOrganize'
  ],
  'admin/store/orders/edit': [
    'OrderBasicInfo', 'OrderDetails', 'Packages', 'Invoice', 'Payment', 'OrderTimeline',
    'CustomerDetails', 'Addresses', 'Delivery'
  ],
  'admin/store/customers/detail': [
    'CustomerBasicInfo', 'CustomerWallet', 'CustomerSegments', 'CustomerOrders',
    'CustomerAddresses', 'CustomerPaymentMethods', 'CustomerInbox'
  ],
  'admin/store/categories/edit': ['CategoryInfo'],
  'admin/store/categories/new': ['CategoryInfo'],
  // Admin - Settings
  'admin/settings/general': ['SiteInformation', 'Localization', 'Contact', 'Social'],
  'admin/settings/store': ['StoreBasic'],
  'admin/settings/delivery': ['DeliveryOptions'],
  'admin/settings/finance': ['PaymentMethods', 'Tax'],
  'admin/settings/marketing': ['MarketingOptions'],
  'admin/settings/web': ['WebOptions'],
  // Storefront (__root__ = full-page replace slot)
  'storefront/home': ['__root__', 'Hero', 'Content'],
  'storefront/product': [
    'AboveBreadcrumb', 'Breadcrumb', 'BelowBreadcrumb',
    'ProductGallery', 'ProductInfo', 'ProductTabs', 'RelatedProducts', 'BelowContent'
  ],
  'storefront/category': ['AboveFilters', 'ProductList', 'BelowProducts', 'Sidebar'],
  'storefront/cart': ['AboveCart', 'CartContent', 'BelowCart'],
  'storefront/checkout': ['AboveSteps', 'Contact', 'Shipping', 'Payment', 'OrderSummary', 'BelowSteps'],
  'storefront/checkout/success': ['AboveMessage', 'Message', 'BelowActions'],
  // Account (StatsRowTail = slot after New Messages for plugin replace, e.g. resale Listings/Sold)
  'account/dashboard': ['Welcome', 'QuickLinks', 'RecentOrders', 'StatsRowTail'],
  'account/information': ['ProfileForm'],
  'account/orders': ['AboveList', 'OrderList', 'BelowList'],
  'account/orders/detail': ['OrderSummary', 'OrderItems', 'BelowActions'],
  'account/addresses': ['AddressList', 'BelowList']
}

/** @deprecated Use DEFAULT_SLOTS */
export const DEFAULT_SECTIONS = DEFAULT_SLOTS

export function usePageSlots(page: string) {
  const ctx = useExtensions()

  return useMemo(() => {
    if (!ctx) {
      return {
        visibleSlots: DEFAULT_SLOTS[page] || [],
        beforeSlots: [] as PageSlotExtension[],
        afterSlots: [] as PageSlotExtension[],
        replacements: new Map<string, PageSlotExtension>()
      }
    }

    const extensions = ctx.getPageSlots(page)
    const hiddenSlots = new Set<string>()
    const replacements = new Map<string, PageSlotExtension>()
    const beforeSlots: PageSlotExtension[] = []
    const afterSlots: PageSlotExtension[] = []

    for (const ext of extensions) {
      if (ext.condition && !ext.condition()) continue
      const slotId = getTargetSlot(ext)

      switch (ext.position) {
        case 'hide':
          if (slotId) hiddenSlots.add(slotId)
          break
        case 'replace':
          if (slotId && !replacements.has(slotId)) {
            replacements.set(slotId, ext)
          }
          break
        case 'before':
          beforeSlots.push(ext)
          break
        case 'after':
          afterSlots.push(ext)
          break
      }
    }

    const visibleSlots = (DEFAULT_SLOTS[page] || []).filter((s) => !hiddenSlots.has(s))

    return { visibleSlots, beforeSlots, afterSlots, replacements }
  }, [ctx, page])
}

/** @deprecated Use usePageSlots. Returns same data with legacy section names. */
export function usePageSections(page: string) {
  const { visibleSlots, beforeSlots, afterSlots, replacements } = usePageSlots(page)
  return {
    visibleSections: visibleSlots,
    beforeSections: beforeSlots,
    afterSections: afterSlots,
    replacements
  }
}
