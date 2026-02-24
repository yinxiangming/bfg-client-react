import type { Extension } from '@/extensions/registry'
import { resaleAdminNav, resaleAccountNav } from './nav'
import ResaleCustomerSection from './sections/ResaleCustomerSection'
import ResaleProductInfoSection from './sections/ResaleProductInfoSection'
import ResaleStorefrontHome from './views/storefront/ResaleStorefrontHome'
import ResaleStorefrontLayout from './views/storefront/ResaleStorefrontLayout'
import { resaleDashboardBlocks } from './views/admin/blocks'
import {
  getProductOwnerInfo,
  getResaleProductByProduct,
  createResaleProduct,
  updateResaleProduct,
  deleteResaleProduct
} from './services/resale'

const resaleExtension: Extension = {
  id: 'resale',
  name: 'Resale Module',
  priority: 100,

  adminNav: [
    {
      id: 'add-resale-menu',
      position: 'after',
      targetId: 'store',
      items: resaleAdminNav
    }
  ],

  // Account sidebar: My Listing (products, bookings, payouts)
  accountNav: [
    {
      id: 'add-resale-account-menu',
      position: 'after',
      targetId: 'orders',
      items: resaleAccountNav
    }
  ],

  // Page section extension - resale owner section below Price section on product edit right sidebar
  sections: [
    {
      id: 'resale-owner-section',
      page: 'admin/store/products/edit',
      position: 'after',
      targetSection: 'ProductPricing',
      component: ResaleCustomerSection,
      priority: 100
    },
    {
      id: 'resale-product-info-section',
      page: 'storefront/product',
      position: 'after',
      targetSection: 'ProductInfo',
      component: ResaleProductInfoSection,
      priority: 100
    // Here is a demo of how to override homepage.
      // },
    // {
    //   id: 'resale-storefront-home-override',
    //   page: 'storefront/home',
    //   position: 'replace',
    //   targetSection: '__root__',
    //   component: ResaleStorefrontHome,
    //   priority: 100
    }
  ],

  // storefrontLayout: ResaleStorefrontLayout,

  dashboardBlocks: resaleDashboardBlocks,

  // Data hooks - extend product data loading and saving
  dataHooks: [
    {
      id: 'resale-product-data',
      page: 'admin/store/products/edit',
      priority: 100,
      onLoad: async (data) => {
        const productId = (data as any)?.id
        if (productId == null) {
          return { ...data, resale_customer_id: null, resale_commission_rate: null, is_resale_product: false }
        }
        try {
          const info = await getProductOwnerInfo(Number(productId))
          if (info.has_owner && info.customer?.id != null) {
            return {
              ...data,
              resale_customer_id: info.customer.id,
              resale_commission_rate: info.commission_rate ?? null,
              is_resale_product: true
            }
          }
        } catch {
          // ignore – resale API may be unavailable
        }
        return {
          ...data,
          resale_customer_id: null,
          resale_commission_rate: null,
          is_resale_product: false
        }
      },
      onSave: async (data) => data,
      afterSave: async (context) => {
        const productId = context.productId as number
        const formData = context.formData as Record<string, unknown>
        if (!productId || formData == null) return

        const customerId = formData.resale_customer_id as number | null | undefined
        const commissionRate = (formData.resale_commission_rate as number) ?? 80
        const hasFormOwner = customerId != null && customerId > 0

        const current = await getProductOwnerInfo(productId)
        const sameOwner = current.has_owner && current.customer?.id === customerId
        const sameRate = (current.commission_rate ?? 80) === commissionRate
        if (!hasFormOwner && !current.has_owner) return
        if (hasFormOwner && current.has_owner && sameOwner && sameRate) return

        const existing = await getResaleProductByProduct(productId)
        if (hasFormOwner) {
          if (existing) {
            await updateResaleProduct(existing.id, {
              customer: customerId!,
              commission_rate: commissionRate
            })
          } else {
            await createResaleProduct({
              product: productId,
              customer: customerId!,
              commission_rate: commissionRate
            })
          }
        } else if (existing) {
          await deleteResaleProduct(existing.id)
        }
      }
    }
  ]
}

export default resaleExtension
