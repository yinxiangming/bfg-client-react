'use client'

import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '@/utils/api'

export type SocialProvider = 'google' | 'facebook' | 'apple'

const ALL_PROVIDERS: SocialProvider[] = ['google', 'facebook', 'apple']

let cached: SocialProvider[] | null = null
let inflight: Promise<SocialProvider[]> | null = null

async function fetchEnabledProviders(): Promise<SocialProvider[]> {
  if (cached) return cached
  if (inflight) return inflight
  const apiBase = getApiBaseUrl().replace(/\/+$/, '')
  inflight = fetch(`${apiBase}/api/v1/auth/providers/`)
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
    .then((body: { providers?: string[] }) => {
      const list = (body?.providers || []).filter(
        (p): p is SocialProvider => ALL_PROVIDERS.includes(p as SocialProvider),
      )
      cached = list
      return list
    })
    .catch(() => {
      // Fail open during the brief outage where the endpoint isn't deployed yet —
      // showing all buttons is the safer default than a blank auth panel.
      const fallback = ALL_PROVIDERS
      cached = fallback
      return fallback
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/**
 * Returns the set of providers the backend reports as configured. Renders
 * with `null` on the first paint (caller should hide its social row to avoid
 * a flash of buttons that immediately disappear), then populates once the
 * one-shot fetch resolves. Subsequent calls are served from a module-level
 * cache, so multiple auth pages don't re-hit the endpoint.
 */
export function useSocialProviders(): SocialProvider[] | null {
  const [providers, setProviders] = useState<SocialProvider[] | null>(cached)
  useEffect(() => {
    if (cached) {
      setProviders(cached)
      return
    }
    let alive = true
    fetchEnabledProviders().then(list => {
      if (alive) setProviders(list)
    })
    return () => {
      alive = false
    }
  }, [])
  return providers
}
