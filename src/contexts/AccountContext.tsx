'use client'

/**
 * The signed-in shopper and the counts the account shell shows everywhere.
 *
 * The sidebar badges, the topbar's unread dot and the dashboard all read the same
 * `/me/` and `/me/dashboard-stats/` responses. Loading them once here keeps those
 * numbers in agreement, and `refreshStats` lets a page that changes one of them
 * (paying, cancelling, reading a message) update the rest.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { authApi } from '@/utils/authApi'
import { meApi } from '@/utils/meApi'

export type AccountStats = {
  wallet_balance: number | null
  wallet_currency: string | null
  /** Orders by order status: pending, processing, shipped, ready_for_pickup, delivered, cancelled, refunded. */
  order_counts: Record<string, number>
  unread_messages_count: number
  /** Keys contributed by server-side dashboard extensions. */
  pluginStats?: Record<string, unknown>
}

export type AccountUser = {
  id: number
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar?: string | null
  language?: string
  timezone_name?: string
  staff_member?: { is_active?: boolean } | null
}

type AccountContextValue = {
  user: AccountUser | null
  stats: AccountStats | null
  /** False until the first stats response (or failure) arrives. */
  statsLoaded: boolean
  refreshUser: () => Promise<void>
  refreshStats: () => Promise<void>
}

const noop = async () => {}

const AccountContext = createContext<AccountContextValue>({
  user: null,
  stats: null,
  statsLoaded: false,
  refreshUser: noop,
  refreshStats: noop
})

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null)
  const [stats, setStats] = useState<AccountStats | null>(null)
  const [statsLoaded, setStatsLoaded] = useState(false)

  const refreshUser = useCallback(async () => {
    if (!authApi.isAuthenticated()) return

    try {
      setUser(await meApi.getMe())
    } catch {
      // Pages that need the profile surface their own error.
    }
  }, [])

  const refreshStats = useCallback(async () => {
    if (!authApi.isAuthenticated()) {
      setStatsLoaded(true)

      return
    }

    try {
      setStats(await meApi.getDashboardStats())
    } catch {
      setStats(null)
    } finally {
      setStatsLoaded(true)
    }
  }, [])

  useEffect(() => {
    refreshUser()
    refreshStats()
  }, [refreshUser, refreshStats])

  const value = useMemo(
    () => ({ user, stats, statsLoaded, refreshUser, refreshStats }),
    [user, stats, statsLoaded, refreshUser, refreshStats]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export const useAccount = () => useContext(AccountContext)
