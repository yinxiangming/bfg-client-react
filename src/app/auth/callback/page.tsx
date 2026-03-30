'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isPlatformInstance, handlePlatformPostLogin } from '@/services/platform'
import { setWorkspaceRefreshToken, setWorkspaceToken } from '@/utils/authTokens'

/**
 * OAuth callback page: reads access/refresh/redirect from URL fragment (set by backend),
 * stores tokens in localStorage, then redirects. Clears hash so tokens are not left in history.
 *
 * On Platform instances, triggers Token Exchange to auto-enter the user's workspace.
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access = params.get('access')
    const refresh = params.get('refresh')
    const redirect = params.get('redirect') || '/account'

    if (access) {
      setWorkspaceToken(access)
      if (refresh) {
        setWorkspaceRefreshToken(refresh)
      }
      window.history.replaceState(null, '', window.location.pathname)

      if (isPlatformInstance()) {
        handlePlatformPostLogin(
          (url: string) => router.replace(url),
          redirect,
        )
      } else {
        router.replace(redirect)
      }
    } else {
      router.replace('/auth/login')
    }
  }, [router])

  return <div>Loading...</div>
}
