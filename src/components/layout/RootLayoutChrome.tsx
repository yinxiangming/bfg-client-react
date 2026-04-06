'use client'

import BlankLayout from '@components/layout/BlankLayout'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { usePathname } from 'next/navigation'
import type { SystemMode } from '@/types/core'

type Props = {
  children: React.ReactNode
  /** Matches previous server default for account/admin/auth chrome */
  defaultSystemMode: SystemMode
}

/**
 * Chooses whether to wrap with StorefrontLayout (config + light-mode chrome for account/admin/auth).
 * Must be client-driven so pathname stays correct after client navigations; server-only `x-pathname`
 * can disagree with the visible route and leave the wrapper mounted on e.g. admin → home.
 */
export default function RootLayoutChrome({ children, defaultSystemMode }: Props) {
  const pathname = usePathname() ?? ''
  const useStorefrontChrome =
    pathname.startsWith('/account') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth/')

  if (useStorefrontChrome) {
    return (
      <BlankLayout>
        <StorefrontLayout mode={defaultSystemMode}>{children}</StorefrontLayout>
      </BlankLayout>
    )
  }

  return <BlankLayout>{children}</BlankLayout>
}
