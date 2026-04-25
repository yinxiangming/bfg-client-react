'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { meApi } from '@/utils/meApi'
import type { PermissionMap } from '@/utils/permissions'

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
  loading: boolean
  refresh: () => void
}

const StaffMemberContext = createContext<StaffMemberContextValue>({
  staffMember: null,
  loading: true,
  refresh: () => {},
})

export function StaffMemberProvider({ children }: { children: ReactNode }) {
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    meApi
      .getMe()
      .then((me: any) => setStaffMember(me?.staff_member ?? null))
      .catch(() => setStaffMember(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <StaffMemberContext.Provider value={{ staffMember, loading, refresh: load }}>
      {children}
    </StaffMemberContext.Provider>
  )
}

export function useStaffMemberContext() {
  return useContext(StaffMemberContext)
}
