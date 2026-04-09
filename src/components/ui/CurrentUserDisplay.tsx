'use client'

import { useEffect, useState } from 'react'
import { meApi } from '@/utils/meApi'
import { authApi } from '@/utils/authApi'
import { fetchWorkspaceRecord } from '@/services/settings'

type UserInfo = {
  fullName: string
  workspaceName: string | null
  workspaceId: number | null
}

/** Dev / explicit non-prod app env; staging can set NEXT_PUBLIC_APP_ENV while NODE_ENV=production. */
function shouldShowWorkspaceIdInHeader(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV
  return Boolean(appEnv && appEnv !== 'production')
}

/**
 * Displays current user full name and workspace name (second line, smaller).
 * Renders nothing when not authenticated.
 */
export default function CurrentUserDisplay() {
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      setUser(null)
      return
    }
    const fetchUser = async () => {
      try {
        const [data, workspace] = await Promise.all([
          meApi.getMe(),
          fetchWorkspaceRecord().catch(() => null)
        ])
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
          || data.username
          || 'User'
        const workspaceName = workspace?.name?.trim() || null
        const workspaceId = workspace?.id ?? null
        setUser({
          fullName,
          workspaceName,
          workspaceId
        })
      } catch {
        setUser(null)
      }
    }
    fetchUser()
  }, [])

  if (!user) return null

  return (
    <div className='current-user-display'>
      <span className='current-user-display-name'>{user.fullName}</span>
      {user.workspaceName && (
        <span className='current-user-display-email'>
          {user.workspaceName}
          {shouldShowWorkspaceIdInHeader() && user.workspaceId != null
            ? ` (${user.workspaceId})`
            : ''}
        </span>
      )}
    </div>
  )
}
