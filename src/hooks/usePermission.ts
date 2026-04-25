import { useStaffMemberContext } from '@/contexts/StaffMemberContext'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from '@/utils/permissions'
import type { StaffRole } from '@/contexts/StaffMemberContext'

export function usePermission(permission: string): boolean {
  const { staffMember } = useStaffMemberContext()
  if (!staffMember?.is_active) return false
  return hasPermission(staffMember.role.permissions, permission)
}

export function useAnyPermission(permissions: string[]): boolean {
  const { staffMember } = useStaffMemberContext()
  if (!staffMember?.is_active) return false
  return hasAnyPermission(staffMember.role.permissions, permissions)
}

export function useAllPermissions(permissions: string[]): boolean {
  const { staffMember } = useStaffMemberContext()
  if (!staffMember?.is_active) return false
  return hasAllPermissions(staffMember.role.permissions, permissions)
}

export function useIsAdmin(): boolean {
  const { staffMember } = useStaffMemberContext()
  return staffMember?.is_active === true && staffMember.role.code === 'admin'
}

export function useIsStaff(): boolean {
  const { staffMember } = useStaffMemberContext()
  return staffMember?.is_active === true
}

export function useRole(): StaffRole | null {
  const { staffMember } = useStaffMemberContext()
  return staffMember?.is_active ? staffMember.role : null
}
