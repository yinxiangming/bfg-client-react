'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ssoExchange } from '@/services/platform'
import { setWorkspaceToken, setWorkspaceRefreshToken } from '@/utils/authTokens'
import { setWorkspaceApiUrlOverride } from '@/utils/apiUrls'

type SSOState = 'loading' | 'success' | 'error'

/**
 * Workspace SSO landing (platform redirect): exchange one-time code for JWT, then go to admin.
 * Lives under /auth so it uses the light auth layout (no admin shell / settings fetch).
 *
 * URL: /auth/sso?code=xxx&next=/admin
 */
export default function AuthSSOPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<SSOState>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setState('error')
      setErrorMessage('Missing SSO code in URL')
      return
    }

    let cancelled = false

    async function exchange() {
      try {
        const result = await ssoExchange(code!)

        if (cancelled) return

        if (result.workspace_url) {
          setWorkspaceApiUrlOverride(result.workspace_url)
        }
        if (result.workspace?.id) {
          localStorage.setItem('workspace_id', String(result.workspace.id))
        }

        setWorkspaceToken(result.access)
        if (result.refresh) {
          setWorkspaceRefreshToken(result.refresh)
        }

        setState('success')

        const next = searchParams.get('next') || result.next || '/admin'
        router.replace(next)
      } catch (err: unknown) {
        if (cancelled) return
        setState('error')
        const message =
          err instanceof Error ? err.message : 'SSO login failed'
        setErrorMessage(message)
      }
    }

    exchange()

    return () => {
      cancelled = true
    }
  }, [searchParams, router])

  if (state === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.125rem', color: '#666' }}>Signing you in...</p>
        </div>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.125rem', color: '#666' }}>Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2 style={{ marginBottom: 8 }}>SSO Login Failed</h2>
        <p style={{ color: '#999', marginBottom: 16 }}>{errorMessage}</p>
        <a href="/auth/login" style={{ color: '#1976d2' }}>
          Go to login
        </a>
      </div>
    </div>
  )
}
