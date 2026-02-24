import Sidebar from '@components/layout/Sidebar'
import Topbar from '@components/layout/Topbar'
import Footer from '@components/layout/Footer'

export const layoutVariants = {
  sidebar: {
    default: Sidebar
  },
  topbar: {
    default: Topbar
  },
  footer: {
    default: Footer
  }
} as const

export const layoutConfig = {
  sidebarVariant: 'default',
  topbarVariant: 'default',
  footerVariant: 'default'
} as const

