'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { meApi } from '@/utils/meApi'
import { authApi } from '@/utils/authApi'
import type { PermissionMap } from '@/utils/permissions'
import type { ExtensionAvailability } from '@/extensions/availability'

export interface StaffRole {
  id: number
  code: string
  name: string
  permissions: PermissionMap
}

export interface StaffMember {
  id: number
  is_active: boolean
  role: StaffRole
}

interface StaffMemberContextValue {
  staffMember: StaffMember | null
  /** Extensions switched on for the workspace; null until loaded or when the server reports none. */
  extensions: ExtensionAvailability | null
  loading: boolean
  refresh: () => void
}

const StaffMemberContext = createContext<StaffMemberContextValue>({
  staffMember: null,
  extensions: null,
  loading: true,
  refresh: () => {},
})

export function StaffMemberProvider({ children }: { children: ReactNode }) {
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null)
  const [extensions, setExtensions] = useState<ExtensionAvailability | null>(null)
  const [loading, setLoading] = useState(true)

  function load() {
    // This provider wraps <AdminAccessGuard>, so it mounts before the guard can
    // bounce a logged-out visitor to /auth/login. Without this check every
    // logged-out hit on /admin fires a guaranteed 403 on /api/v1/me/.
    if (!authApi.isAuthenticated()) {
      setStaffMember(null)
      setExtensions(null)
      setLoading(false)
      return
    }
    setLoading(true)
    meApi
      .getMe()
      .then((me: any) => {
        setStaffMember(me?.staff_member ?? null)
        setExtensions(me?.extensions ?? null)
      })
      .catch(() => {
        setStaffMember(null)
        setExtensions(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <StaffMemberContext.Provider value={{ staffMember, extensions, loading, refresh: load }}>
      {children}
    </StaffMemberContext.Provider>
  )
}

export function useStaffMemberContext() {
  return useContext(StaffMemberContext)
}
