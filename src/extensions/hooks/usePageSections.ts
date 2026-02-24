import { useMemo } from 'react'
import { useExtensions } from '../context'
import type { PageSectionExtension } from '../registry'

// Default sections definition (for hide/replace detection)
// Used by plugin sections (before/after/replace/hide); documented in docs/extend/plugin/README.md
export const DEFAULT_SECTIONS: Record<string, string[]> = {
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
  // Account
  'account/dashboard': ['Welcome', 'QuickLinks', 'RecentOrders'],
  'account/information': ['ProfileForm'],
  'account/orders': ['AboveList', 'OrderList', 'BelowList'],
  'account/orders/detail': ['OrderSummary', 'OrderItems', 'BelowActions'],
  'account/addresses': ['AddressList', 'BelowList']
}

export function usePageSections(page: string) {
  const ctx = useExtensions()

  return useMemo(() => {
    if (!ctx) {
      return { 
        visibleSections: DEFAULT_SECTIONS[page] || [],
        beforeSections: [],
        afterSections: [],
        replacements: new Map<string, PageSectionExtension>()
      }
    }

    const extensions = ctx.getPageSections(page)
    const hiddenSections = new Set<string>()
    const replacements = new Map<string, PageSectionExtension>()
    const beforeSections: PageSectionExtension[] = []
    const afterSections: PageSectionExtension[] = []

    for (const ext of extensions) {
      if (ext.condition && !ext.condition()) continue

      switch (ext.position) {
        case 'hide':
          if (ext.targetSection) hiddenSections.add(ext.targetSection)
          break
        case 'replace':
          if (ext.targetSection && !replacements.has(ext.targetSection)) {
            replacements.set(ext.targetSection, ext)
          }
          break
        case 'before':
          beforeSections.push(ext)
          break
        case 'after':
          afterSections.push(ext)
          break
      }
    }

    const visibleSections = (DEFAULT_SECTIONS[page] || [])
      .filter(s => !hiddenSections.has(s))

    return { visibleSections, beforeSections, afterSections, replacements }
  }, [ctx, page])
}
