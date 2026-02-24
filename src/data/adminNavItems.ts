import type { MenuNode } from '@/types/menu'

export const adminNavItems: MenuNode[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    i18nKey: 'nav.dashboard',
    href: '/admin/dashboard',
    icon: 'tabler-layout-dashboard'
  },
  {
    id: 'store',
    label: 'Store',
    i18nKey: 'nav.store',
    icon: 'tabler-shopping-cart',
    type: 'submenu',
    children: [
      {
        id: 'store-orders',
        label: 'Orders',
        i18nKey: 'nav.storeOrders',
        href: '/admin/store/orders',
        icon: 'tabler-shopping-bag'
      },
      {
        id: 'store-products-list',
        label: 'Products',
        i18nKey: 'nav.storeProducts',
        href: '/admin/store/products',
        icon: 'tabler-package'
      },
      {
        id: 'store-customers',
        label: 'Customers',
        i18nKey: 'nav.storeCustomers',
        href: '/admin/store/customers',
        icon: 'tabler-users'
      },
      {
        id: 'store-categories',
        label: 'Categories',
        i18nKey: 'nav.storeCategories',
        href: '/admin/store/categories',
        icon: 'tabler-folders'
      },
      {
        id: 'store-stores',
        label: 'Stores',
        i18nKey: 'nav.storeStores',
        href: '/admin/store/stores',
        icon: 'tabler-building-warehouse'
      }
    ]
  },
  {
    id: 'support',
    label: 'Support',
    i18nKey: 'nav.support',
    icon: 'tabler-headset',
    type: 'submenu',
    children: [
      {
        id: 'support-tickets',
        label: 'Tickets',
        i18nKey: 'nav.supportTickets',
        href: '/admin/support/tickets',
        icon: 'tabler-ticket'
      },
      {
        id: 'support-customers',
        label: 'Customers',
        i18nKey: 'nav.supportCustomers',
        href: '/admin/support/customers',
        icon: 'tabler-users'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    i18nKey: 'nav.settings',
    icon: 'tabler-settings-2',
    type: 'submenu',
    children: [
      {
        id: 'settings-general',
        label: 'General',
        i18nKey: 'nav.settingsGeneral',
        href: '/admin/settings/general',
        icon: 'tabler-adjustments'
      },
      {
        id: 'settings-web',
        label: 'Web',
        i18nKey: 'nav.settingsWeb',
        href: '/admin/settings/web',
        icon: 'tabler-world-cog'
      },
      {
        id: 'settings-store',
        label: 'Store',
        i18nKey: 'nav.settingsStore',
        href: '/admin/settings/store',
        icon: 'tabler-shopping-cart-cog'
      },
      {
        id: 'settings-finance',
        label: 'Finance',
        i18nKey: 'nav.settingsFinance',
        href: '/admin/settings/finance',
        icon: 'tabler-currency-dollar'
      },
      {
        id: 'settings-delivery',
        label: 'Delivery',
        i18nKey: 'nav.settingsDelivery',
        href: '/admin/settings/delivery',
        icon: 'tabler-truck-delivery'
      },
      {
        id: 'settings-marketing',
        label: 'Marketing',
        i18nKey: 'nav.settingsMarketing',
        href: '/admin/settings/marketing',
        icon: 'tabler-speakerphone'
      }
    ]
  }
]

