'use client'

// React Imports
import { usePathname } from 'next/navigation'

// Component Imports
import StoreHeader from './themes/store/Header'
import StoreFooter from './themes/store/Footer'
import SiteAnnouncementBanner from './SiteAnnouncementBanner'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import { ChildrenType } from '@/types/core'
import { SystemMode } from '@/types/core'

type StorefrontLayoutProps = ChildrenType & {
  mode?: SystemMode
}

/** Inner layout shell (header + main + footer). Used by theme registry when provider is already above. */
export function StorefrontLayoutInner({ children, mode = 'light' }: StorefrontLayoutProps) {
  const pathname = usePathname()
  const isAccountPage = pathname?.startsWith('/account') || false
  const isAdminPage = pathname?.startsWith('/admin') || false
  const isAuthPage = pathname?.startsWith('/auth/') || false

  if (isAccountPage || isAdminPage || isAuthPage) {
    return (
      <div className='flex flex-col min-bs-screen'>
        <main className='flex-1'>{children}</main>
      </div>
    )
  }

  return (
    <div className='flex flex-col min-bs-screen'>
      <SiteAnnouncementBanner />
      <StoreHeader mode={mode} />
      <main className='flex-1'>{children}</main>
      <StoreFooter mode={mode} />
    </div>
  )
}

/** Full store layout with config provider. Use when this layout is the root (e.g. non-theme flow). */
const StorefrontLayout = ({ children, mode = 'light' }: StorefrontLayoutProps) => {
  return (
    <StorefrontConfigProvider>
      <StorefrontLayoutInner mode={mode}>{children}</StorefrontLayoutInner>
    </StorefrontConfigProvider>
  )
}

export default StorefrontLayout

