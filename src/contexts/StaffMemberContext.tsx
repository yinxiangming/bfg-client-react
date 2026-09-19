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

/** The slice of GET /api/v1/me/ this provider reads. */
export interface MeResponse {
  staff_member?: StaffMember | null
  extensions?: ExtensionAvailability | null
  /**
   * True while the workspace may only be read: writes are refused with
   * workspace_read_only until its plan is renewed. Optional because a server
   * without the feature omits it, and an absent field means an ordinary workspace —
   * never assume the stricter answer from a field that was never sent.
   */
  workspace_read_only?: boolean
}

interface StaffMemberContextValue {
  staffMember: StaffMember | null
  /** Extensions switched on for the workspace; null until loaded or when the server reports none. */
  extensions: ExtensionAvailability | null
  /** Whether the workspace currently refuses writes. False until me/ says otherwise. */
  workspaceReadOnly: boolean
  loading: boolean
  refresh: () => void
}

const StaffMemberContext = createContext<StaffMemberContextValue>({
  staffMember: null,
  extensions: null,
  workspaceReadOnly: false,
  loading: true,
  refresh: () => {},
})

export function StaffMemberProvider({ children }: { children: ReactNode }) {
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null)
  const [extensions, setExtensions] = useState<ExtensionAvailability | null>(null)
  const [workspaceReadOnly, setWorkspaceReadOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  function load() {
    // This provider wraps <AdminAccessGuard>, so it mounts before the guard can
    // bounce a logged-out visitor to /auth/login. Without this check every
    // logged-out hit on /admin fires a guaranteed 403 on /api/v1/me/.
    if (!authApi.isAuthenticated()) {
      setStaffMember(null)
      setExtensions(null)
      setWorkspaceReadOnly(false)
      setLoading(false)
      return
    }
    setLoading(true)
    meApi
      .getMe()
      .then((me: MeResponse | null) => {
        setStaffMember(me?.staff_member ?? null)
        setExtensions(me?.extensions ?? null)
        // Only an explicit `true` closes the back office. A server that does not
        // report the field, or a response that failed to parse, leaves it open.
        setWorkspaceReadOnly(me?.workspace_read_only === true)
      })
      .catch(() => {
        setStaffMember(null)
        setExtensions(null)
        setWorkspaceReadOnly(false)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <StaffMemberContext.Provider value={{ staffMember, extensions, workspaceReadOnly, loading, refresh: load }}>
      {children}
    </StaffMemberContext.Provider>
  )
}

export function useStaffMemberContext() {
  return useContext(StaffMemberContext)
}
