import type { MenuNode } from '@/types/menu'

// Resale account menu: My Listing submenu (products, bookings, payouts)
export const resaleAccountNav: MenuNode[] = [
  {
    id: 'resale-my-listing',
    label: 'My Listing',
    i18nKey: 'nav.resaleMyListing',
    icon: 'tabler-building-store',
    type: 'submenu',
    children: [
      {
        id: 'resale-my-products',
        label: 'My Products',
        i18nKey: 'nav.resaleMyProducts',
        href: '/account/plugins/resale/products',
        icon: 'tabler-package'
      },
      {
        id: 'resale-my-bookings',
        label: 'Bookings',
        i18nKey: 'nav.resaleMyBookings',
        href: '/account/plugins/resale/bookings',
        icon: 'tabler-calendar-event'
      },
      {
        id: 'resale-my-payouts',
        label: 'Payouts',
        i18nKey: 'nav.resaleMyPayouts',
        href: '/account/plugins/resale/payouts',
        icon: 'tabler-cash'
      },
      {
        id: 'resale-my-preference',
        label: 'Payout Preference',
        i18nKey: 'nav.resaleMyPreference',
        href: '/account/plugins/resale/preference',
        icon: 'tabler-wallet'
      }
    ]
  }
]

// Resale navigation items for admin menu
export const resaleAdminNav: MenuNode[] = [
  {
    id: 'resale',
    label: 'Resale',
    i18nKey: 'nav.resale',
    icon: 'tabler-building-store',
    type: 'submenu',
    children: [
      {
        id: 'resale-settings',
        label: 'Settings',
        i18nKey: 'nav.resaleSettings',
        href: '/admin/plugins/resale/settings',
        icon: 'tabler-settings'
      },
      {
        id: 'resale-timeslots',
        label: 'Time Slots',
        i18nKey: 'nav.resaleTimeslots',
        href: '/admin/plugins/resale/timeslots',
        icon: 'tabler-calendar-time'
      },
      {
        id: 'resale-bookings',
        label: 'Bookings',
        i18nKey: 'nav.resaleBookings',
        href: '/admin/plugins/resale/bookings',
        icon: 'tabler-calendar-event'
      },
      {
        id: 'resale-products',
        label: 'Products',
        i18nKey: 'nav.resaleProducts',
        href: '/admin/plugins/resale/products',
        icon: 'tabler-package'
      },
      {
        id: 'resale-payouts',
        label: 'Payouts',
        i18nKey: 'nav.resalePayouts',
        href: '/admin/plugins/resale/payouts',
        icon: 'tabler-cash'
      }
    ]
  }
]
