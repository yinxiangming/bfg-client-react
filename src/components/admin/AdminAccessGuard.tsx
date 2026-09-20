'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authApi } from '@/utils/authApi'
import { useStaffMemberContext } from '@/contexts/StaffMemberContext'
import { useIsStaff } from '@/hooks/usePermission'

/**
 * Gates every /admin page on staff membership.
 *
 *   - no token            → /auth/login
 *   - token, not staff    → /account  (the customer area)
 *   - active staff member → render children
 *
 * Mount this *inside* a <StaffMemberProvider> so the context is available.
 */
export default function AdminAccessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading } = useStaffMemberContext()
  const isStaff = useIsStaff()
  const authenticated = typeof window !== 'undefined' && authApi.isAuthenticated()

  useEffect(() => {
    if (!authenticated) {
      const redirect = pathname || '/admin'
      router.replace(`/auth/login?redirect=${encodeURIComponent(redirect)}`)
      return
    }
    if (loading) return
    if (!isStaff) {
      router.replace('/account')
    }
  }, [authenticated, loading, isStaff, pathname, router])

  if (!authenticated) return null
  if (loading) return null
  if (!isStaff) return null
  return <>{children}</>
}
