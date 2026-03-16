import type { MenuNode } from '@/types/menu'

// Simplified navigation with refreshed icons
export const defaultNavItems: MenuNode[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    i18nKey: 'nav.dashboard',
    href: '/account/',
    icon: 'tabler-layout-dashboard',
    activeMatch: 'exact'
  },
  {
    id: 'orders',
    label: 'My Orders',
    i18nKey: 'nav.orders',
    href: '/account/orders',
    icon: 'tabler-shopping-cart'
  },
  {
    id: 'addresses',
    label: 'Addresses',
    i18nKey: 'nav.addresses',
    href: '/account/addresses',
    icon: 'tabler-map-pin'
  },
  {
    id: 'payments',
    label: 'Payments',
    i18nKey: 'nav.payments',
    href: '/account/payments',
    icon: 'tabler-credit-card'
  },
  {
    id: 'inbox',
    label: 'Inbox',
    i18nKey: 'nav.inbox',
    href: '/account/alerts',
    icon: 'tabler-mail'
  },
  {
    id: 'support',
    label: 'Customer Support',
    i18nKey: 'nav.support',
    href: '/account/support',
    icon: 'tabler-headset'
  },
  {
    id: 'settings',
    label: 'Settings',
    i18nKey: 'nav.settings',
    href: '/account/settings',
    icon: 'tabler-settings'
  }
]
