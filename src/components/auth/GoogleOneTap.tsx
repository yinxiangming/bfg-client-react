'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getApiBaseUrl, getApiHeaders } from '@/utils/api'
import { getWorkspaceToken, setWorkspaceRefreshToken, setWorkspaceToken } from '@/utils/authTokens'
import { useSocialProviderConfig } from '@/hooks/useSocialProviders'
import { trackEvent } from '@/utils/analytics'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

/** Paths One Tap stays out of: the back-office has its own sign-in story. */
const EXCLUDED_PREFIXES = ['/admin']

type Props = {
  /** Where to send the visitor after a sign-in that happened on an auth page. */
  redirectTo?: string
}

let gsiLoad: Promise<void> | null = null

function loadGsi(): Promise<void> {
  if (gsiLoad) return gsiLoad
  gsiLoad = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
      return
    }
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      gsiLoad = null
      reject(new Error('Failed to load Google Identity Services'))
    }
    document.head.appendChild(script)
  })
  return gsiLoad
}

/**
 * Google One Tap — the prompt Chrome shows in the top-right corner offering the
 * Google account the visitor is already signed in to.
 *
 * Sign-up and sign-in are the same gesture: the backend creates the account on
 * first use and links it to an existing local account with the same verified
 * email, so a new visitor never sees a registration form.
 *
 * Renders nothing and makes no network call unless the backend reports a
 * configured Google client id, so an install without Google credentials is
 * unaffected. The prompt itself is suppressed for signed-in visitors, on
 * `/admin`, and on Platform-managed workspaces (where login is delegated).
 */
export default function GoogleOneTap({ redirectTo }: Props) {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const config = useSocialProviderConfig()
  const clientId = config?.googleClientId ?? ''
  // Google warns (and stops prompting) if initialize() runs twice per page.
  const initialized = useRef(false)

  const handleCredential = useCallback(
    async (credential: string) => {
      const apiBase = getApiBaseUrl().replace(/\/+$/, '')
      try {
        const res = await fetch(`${apiBase}/api/v1/auth/google/one-tap/`, {
          method: 'POST',
          headers: getApiHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ credential }),
        })
        if (!res.ok) {
          console.error('[GoogleOneTap] sign-in rejected:', res.status, await res.text())
          return
        }
        const data: { access?: string; refresh?: string; is_new_user?: boolean } = await res.json()
        if (!data.access) return

        setWorkspaceToken(data.access)
        if (data.refresh) setWorkspaceRefreshToken(data.refresh)
        trackEvent(data.is_new_user ? 'sign_up' : 'login', { method: 'google_one_tap' })

        // On an auth page the visitor is actively trying to get somewhere;
        // anywhere else, keep them on the page and just re-render as signed in.
        if (pathname.startsWith('/auth/')) {
          router.replace(redirectTo || '/account')
        } else {
          router.refresh()
        }
      } catch (err) {
        console.error('[GoogleOneTap] sign-in failed:', err)
      }
    },
    [pathname, redirectTo, router],
  )

  useEffect(() => {
    if (!clientId || initialized.current) return
    if (EXCLUDED_PREFIXES.some(prefix => pathname.startsWith(prefix))) return
    // Platform-managed workspaces hand login off to the platform instance.
    if (process.env.NEXT_PUBLIC_PLATFORM_LOGIN_URL) return
    if (getWorkspaceToken()) return

    let cancelled = false
    loadGsi()
      .then(() => {
        if (cancelled || initialized.current) return
        initialized.current = true
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response?.credential) void handleCredential(response.credential)
          },
          // FedCM is mandatory in Chrome — the legacy One Tap iframe no longer
          // renders. It also puts the prompt in the browser's own UI.
          use_fedcm_for_prompt: true,
          // Returning visitors who already granted consent are signed straight
          // back in; first-timers still get an explicit "continue as" tap.
          auto_select: true,
          cancel_on_tap_outside: false,
          itp_support: true,
          context: 'signin',
        })
        window.google.accounts.id.prompt()
      })
      .catch(err => {
        console.warn('[GoogleOneTap] disabled:', err)
      })

    return () => {
      cancelled = true
    }
  }, [clientId, handleCredential, pathname])

  return null
}
