'use client'

import { useEffect, useState } from 'react'
import { meApi } from '@/utils/meApi'
import { authApi } from '@/utils/authApi'

type UserInfo = {
  fullName: string
  email: string
}

/**
 * Displays current user full name and email (email on second line, smaller).
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
        const data = await meApi.getMe()
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
          || data.username
          || 'User'
        setUser({
          fullName,
          email: data.email || ''
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
      {user.email && (
        <span className='current-user-display-email'>{user.email}</span>
      )}
    </div>
  )
}
