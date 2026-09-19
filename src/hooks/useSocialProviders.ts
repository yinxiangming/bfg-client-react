'use client'

import { useEffect, useState } from 'react'
import { getApiBaseUrl, getApiHeaders } from '@/utils/api'

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

/**
 * Which shop we are asking about. Providers are configured per workspace — each
 * shop registers its own OAuth client with Google — so one module-level cache
 * would serve the first host's answer to every other host the bundle runs on.
 */
function cacheKey(): string {
  return typeof window === 'undefined' ? '' : window.location.host
}

const cached = new Map<string, SocialProviderConfig>()
const inflight = new Map<string, Promise<SocialProviderConfig>>()

async function fetchEnabledProviders(): Promise<SocialProviderConfig> {
  const key = cacheKey()
  const hit = cached.get(key)
  if (hit) return hit
  const pending = inflight.get(key)
  if (pending) return pending

  const apiBase = getApiBaseUrl().replace(/\/+$/, '')
  // The API is a different origin from every storefront, so the workspace has
  // to travel in a header — without it the backend cannot tell which shop is
  // asking, and answers for none of them.
  const request = fetch(`${apiBase}/api/v1/auth/providers/`, { headers: getApiHeaders() })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
    .then((body: { providers?: string[]; google_client_id?: string }) => {
      const config: SocialProviderConfig = {
        providers: (body?.providers || []).filter(
          (p): p is SocialProvider => ALL_PROVIDERS.includes(p as SocialProvider),
        ),
        googleClientId: (body?.google_client_id || '').trim(),
      }
      cached.set(key, config)
      return config
    })
    .catch(() => {
      // Fail closed. A shop that has not registered its own OAuth client has no
      // working social login, so guessing at a full set of buttons would send
      // visitors to a provider that rejects them. Email sign-in still works.
      const fallback: SocialProviderConfig = { providers: [], googleClientId: '' }
      cached.set(key, fallback)
      return fallback
    })
    .finally(() => {
      inflight.delete(key)
    })
  inflight.set(key, request)
  return request
}

/**
 * Returns the set of providers the backend reports as configured. Renders
 * with `null` on the first paint (caller should hide its social row to avoid
 * a flash of buttons that immediately disappear), then populates once the
 * one-shot fetch resolves. Subsequent calls are served from a module-level
 * cache keyed on the storefront host, so multiple auth pages don't re-hit the
 * endpoint.
 */
export function useSocialProviders(): SocialProvider[] | null {
  return useSocialProviderConfig()?.providers ?? null
}

/**
 * Same one-shot fetch as {@link useSocialProviders}, but returns the whole
 * config (provider list + Google client id). `null` until it resolves.
 */
export function useSocialProviderConfig(): SocialProviderConfig | null {
  const [config, setConfig] = useState<SocialProviderConfig | null>(null)
  useEffect(() => {
    const hit = cached.get(cacheKey())
    if (hit) {
      setConfig(hit)
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
