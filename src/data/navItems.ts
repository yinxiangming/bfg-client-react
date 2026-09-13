import type { MenuNode } from '@/types/menu'

/**
 * Customer account navigation, grouped the way the back office groups its menu.
 *
 * Item ids are stable: extensions place their own entries against them
 * (`applyNavExtensions` looks inside sections), and the account shell hangs its
 * counts on `orders` and `inbox`.
 */
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
    type: 'section',
    id: 'shopping',
    label: 'Shopping',
    i18nKey: 'nav.sections.shopping',
    children: [
      {
        id: 'orders',
        label: 'Orders',
        i18nKey: 'nav.orders',
        href: '/account/orders',
        icon: 'tabler-shopping-cart'
      },
      {
        id: 'returns',
        label: 'Returns',
        i18nKey: 'nav.returns',
        href: '/account/returns',
        icon: 'tabler-receipt-refund'
      }
    ]
  },
  {
    type: 'section',
    id: 'account',
    label: 'Account',
    i18nKey: 'nav.sections.account',
    children: [
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
        id: 'settings',
        label: 'Settings',
        i18nKey: 'nav.settings',
        href: '/account/settings',
        icon: 'tabler-settings'
      }
    ]
  },
  {
    type: 'section',
    id: 'help',
    label: 'Help',
    i18nKey: 'nav.sections.help',
    children: [
      {
        id: 'inbox',
        label: 'Inbox',
        i18nKey: 'nav.inbox',
        href: '/account/alerts',
        icon: 'tabler-mail'
      },
      {
        id: 'support',
        label: 'Customer support',
        i18nKey: 'nav.support',
        href: '/account/support',
        icon: 'tabler-headset'
      }
    ]
  }
]
