'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * OAuth callback page: reads access/refresh/redirect from URL fragment (set by backend),
 * stores tokens in localStorage, then redirects. Clears hash so tokens are not left in history.
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
      localStorage.setItem('auth_token', access)
      if (refresh) {
        localStorage.setItem('refresh_token', refresh)
      }
      window.history.replaceState(null, '', window.location.pathname)
      router.replace(redirect)
    } else {
      router.replace('/auth/login')
    }
  }, [router])

  return <div>Loading...</div>
}
