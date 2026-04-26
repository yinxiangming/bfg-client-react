'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { apiFetch, bfgApi } from '@/utils/api'
import { authApi } from '@/utils/authApi'
import { meApi } from '@/utils/meApi'

interface PreviewWorkspace {
  id: number
  name: string
  slug: string
}

interface PreviewRole {
  id: number
  name: string
  code: string
}

interface PreviewInviter {
  id: number
  name: string
  email: string
}

interface InvitationPreview {
  workspace: PreviewWorkspace
  role: PreviewRole
  email: string
  invited_by: PreviewInviter | null
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  message: string
  account_exists: boolean
}

interface MeResponse {
  email: string
  first_name?: string
  last_name?: string
}

export default function InvitationAcceptPage() {
  const t = useTranslations('auth.invite')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const uuid = searchParams.get('uuid') ?? ''

  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState<{ workspace: PreviewWorkspace } | null>(null)
  const [countdown, setCountdown] = useState<number>(5)

  const isAuthed = typeof window !== 'undefined' && authApi.isAuthenticated()

  const loadPreview = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = new URLSearchParams({ token })
      if (uuid) params.set('uuid', uuid)
      const data = await apiFetch<InvitationPreview>(
        `${bfgApi.invitationPreview()}?${params.toString()}`
      )
      setPreview(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('invalid')
      setLoadError(msg)
    } finally {
      setLoading(false)
    }
  }, [token, uuid, t])

  const loadMe = useCallback(async () => {
    if (!isAuthed) return
    try {
      const data = (await meApi.getMe()) as MeResponse
      setMe(data)
    } catch {
      // Token may be stale; treat as logged-out.
      setMe(null)
    }
  }, [isAuthed])

  useEffect(() => {
    if (!token) {
      setLoadError(t('invalid'))
      setLoading(false)
      return
    }
    loadPreview()
    loadMe()
  }, [token, loadPreview, loadMe, t])

  async function handleAccept() {
    if (!preview) return
    setAccepting(true)
    setAcceptError(null)
    try {
      const data = await apiFetch<{ workspace: PreviewWorkspace }>(bfgApi.invitationAccept(), {
        method: 'POST',
        body: JSON.stringify({ token, uuid }),
      })
      setAccepted({ workspace: data.workspace })
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : t('acceptError'))
    } finally {
      setAccepting(false)
    }
  }

  const successWorkspace =
    accepted?.workspace ??
    (preview && preview.status === 'accepted' ? preview.workspace : null)

  useEffect(() => {
    if (!successWorkspace) return
    setCountdown(5)
    const tick = setInterval(() => {
      setCountdown((n) => (n > 0 ? n - 1 : 0))
    }, 1000)
    const redirectTimer = setTimeout(() => {
      router.push('/admin')
    }, 5000)
    return () => {
      clearInterval(tick)
      clearTimeout(redirectTimer)
    }
  }, [successWorkspace, router])

  function handleSwitchAccount() {
    authApi.logout()
    router.replace(redirectToLogin())
  }

  function redirectToLogin() {
    const params = new URLSearchParams({
      redirect: `/auth/invite/accept?token=${encodeURIComponent(token)}${uuid ? `&uuid=${encodeURIComponent(uuid)}` : ''}`,
    })
    return `/auth/login?${params.toString()}`
  }

  function redirectToRegister() {
    const params = new URLSearchParams({
      invite_token: token,
      invite_uuid: uuid,
      email: preview?.email ?? '',
    })
    return `/auth/register?${params.toString()}`
  }

  return (
    <div className="auth-shell">
      <div className="auth-card max-w-md mx-auto p-6">
        <h1 className="text-xl font-semibold mb-4">{t('pageTitle')}</h1>

        {loading && <p className="text-sm text-gray-500">{t('loading')}</p>}

        {!loading && loadError && (
          <div className="auth-error mb-3">{loadError}</div>
        )}

        {!loading && preview && !successWorkspace && (
          <>
            {preview.status !== 'pending' ? (
              <div className="auth-error mb-3">
                {preview.status === 'expired' && t('expired')}
                {preview.status === 'revoked' && t('revoked')}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('invitedTo')} <strong>{preview.workspace.name}</strong>{' '}
                    {t('asRole', { role: preview.role.name })}.
                  </p>
                  {preview.invited_by && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('invitedBy', { name: preview.invited_by.name })}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {t('expiresOn', {
                      date: new Date(preview.expires_at).toLocaleString(),
                    })}
                  </p>
                  {preview.message && (
                    <blockquote className="mt-3 border-l-2 border-gray-200 dark:border-white/10 pl-3 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      {preview.message}
                    </blockquote>
                  )}
                </div>

                {isAuthed && me ? (
                  me.email.toLowerCase() === preview.email.toLowerCase() ? (
                    <>
                      {acceptError && <div className="auth-error">{acceptError}</div>}
                      <button
                        type="button"
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {accepting ? t('accepting') : t('accept')}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="auth-error">
                        {t('mismatch', {
                          current: me.email,
                          invitedEmail: preview.email,
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={handleSwitchAccount}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-white/15 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        {t('switchAccount')}
                      </button>
                    </>
                  )
                ) : preview.account_exists ? (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t('signInHint', { email: preview.email })}
                    </p>
                    <Link
                      href={redirectToLogin()}
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      {t('signInToAccept')}
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t('signUpHint', { workspace: preview.workspace.name })}
                    </p>
                    <Link
                      href={redirectToRegister()}
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      {t('signUpToAccept')}
                    </Link>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {successWorkspace && (
          <div className="space-y-3">
            <div className="rounded-lg border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
              {accepted
                ? t('success', { workspace: successWorkspace.name })
                : t('alreadyAccepted')}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t('redirectingIn', { seconds: countdown })}
            </p>
            <Link
              href="/admin"
              className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              {t('goToAdmin')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

