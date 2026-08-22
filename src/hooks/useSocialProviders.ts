'use client'

import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '@/utils/api'

export type SocialProvider = 'google' | 'facebook' | 'apple'

const ALL_PROVIDERS: SocialProvider[] = ['google', 'facebook', 'apple']

export type SocialProviderConfig = {
  providers: SocialProvider[]
  /**
   * OAuth *Web application* client id for Google Identity Services (One Tap /
   * the rendered Sign in with Google button). Public by design; blank when
   * Google is not configured on the backend.
   */
  googleClientId: string
}

let cached: SocialProviderConfig | null = null
let inflight: Promise<SocialProviderConfig> | null = null

async function fetchEnabledProviders(): Promise<SocialProviderConfig> {
  if (cached) return cached
  if (inflight) return inflight
  const apiBase = getApiBaseUrl().replace(/\/+$/, '')
  inflight = fetch(`${apiBase}/api/v1/auth/providers/`)
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
    .then((body: { providers?: string[]; google_client_id?: string }) => {
      const config: SocialProviderConfig = {
        providers: (body?.providers || []).filter(
          (p): p is SocialProvider => ALL_PROVIDERS.includes(p as SocialProvider),
        ),
        googleClientId: (body?.google_client_id || '').trim(),
      }
      cached = config
      return config
    })
    .catch(() => {
      // Fail open during the brief outage where the endpoint isn't deployed yet —
      // showing all buttons is the safer default than a blank auth panel. One Tap
      // stays off though: without a client id there is nothing to initialise.
      const fallback: SocialProviderConfig = { providers: ALL_PROVIDERS, googleClientId: '' }
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
  return useSocialProviderConfig()?.providers ?? null
}

/**
 * Same one-shot fetch as {@link useSocialProviders}, but returns the whole
 * config (provider list + Google client id). `null` until it resolves.
 */
export function useSocialProviderConfig(): SocialProviderConfig | null {
  const [config, setConfig] = useState<SocialProviderConfig | null>(cached)
  useEffect(() => {
    if (cached) {
      setConfig(cached)
      return
    }
    let alive = true
    fetchEnabledProviders().then(next => {
      if (alive) setConfig(next)
    })
    return () => {
      alive = false
    }
  }, [])
  return config
}
