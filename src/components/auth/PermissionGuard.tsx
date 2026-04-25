/**
 * PermissionGuard — inline RBAC gate for conditional rendering.
 *
 * Usage:
 * <PermissionGuard permission="shop.product.create">
 *   <Button>Add Product</Button>
 * </PermissionGuard>
 *
 * <PermissionGuard requireAdmin fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </PermissionGuard>
 */

import type { ReactNode } from 'react'
import { usePermission, useIsAdmin, useRole } from '@/hooks/usePermission'

interface PermissionGuardProps {
  permission?: string
  role?: string
  requireAdmin?: boolean
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({
  permission,
  role,
  requireAdmin,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const hasPermission = usePermission(permission ?? '')
  const isAdmin = useIsAdmin()
  const currentRole = useRole()

  const permissionOk = permission ? hasPermission : true
  const roleOk = role ? currentRole?.code === role : true
  const adminOk = requireAdmin ? isAdmin : true

  if (permissionOk && roleOk && adminOk) {
    return <>{children}</>
  }
  return <>{fallback}</>
}
