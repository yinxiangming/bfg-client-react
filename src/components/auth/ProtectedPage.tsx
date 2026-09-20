'use client'

import { type ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermission, useIsAdmin, useIsStaff } from '@/hooks/usePermission'
import { useStaffMemberContext } from '@/contexts/StaffMemberContext'

interface ProtectedPageProps {
  permission?: string
  requireAdmin?: boolean
  loginPath?: string
  forbiddenPath?: string
  children: ReactNode
}

export function ProtectedPage({
  permission,
  requireAdmin,
  loginPath = '/auth/login',
  forbiddenPath = '/admin',
  children,
}: ProtectedPageProps) {
  const router = useRouter()
  const { loading } = useStaffMemberContext()
  const isStaff = useIsStaff()
  const isAdmin = useIsAdmin()
  const hasPermission = usePermission(permission ?? '')

  useEffect(() => {
    if (loading) return
    if (!isStaff) {
      router.replace(loginPath)
      return
    }
    if (requireAdmin && !isAdmin) {
      router.replace(forbiddenPath)
      return
    }
    if (permission && !hasPermission) {
      router.replace(forbiddenPath)
    }
  }, [loading, isStaff, isAdmin, hasPermission])

  if (loading) return null
  if (!isStaff) return null
  if (requireAdmin && !isAdmin) return null
  if (permission && !hasPermission) return null

  return <>{children}</>
}
