'use client'

import { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { authApi } from '@/utils/authApi'
import { getApiBaseUrl } from '@/utils/api'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { isPlatformInstance, handlePlatformPostLogin } from '@/services/platform'

/**
 * Website-skin login. Pure HTML form, no MUI components — uses the
 * .au-* CSS classes from website-auth.css.
 */
export default function WebsiteLoginPage() {
  const t = useTranslations('auth.login')
  const router = useRouter()
  const searchParams = useSearchParams()
  const config = useStorefrontConfigSafe()
  const siteName = config?.site_name?.trim() || 'BFG'
  const initial = siteName.charAt(0).toUpperCase()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirect = searchParams.get('redirect') ? decodeURIComponent(searchParams.get('redirect')!) : '/account'
  const host = typeof window !== 'undefined' ? window.location.host : ''

  const platformLoginUrl = process.env.NEXT_PUBLIC_PLATFORM_LOGIN_URL
  useEffect(() => {
    if (platformLoginUrl) {
      window.location.replace(platformLoginUrl)
    }
  }, [platformLoginUrl])

  const socialLogin = (provider: string) => {
    const apiBase = getApiBaseUrl().replace(/\/+$/, '')
    const params = new URLSearchParams({ redirect, host })
    window.location.href = `${apiBase}/api/v1/auth/${provider}/login/?${params}`
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      await authApi.login({ email, password })
      if (isPlatformInstance()) {
        await handlePlatformPostLogin((url: string) => router.push(url), redirect)
      } else {
        router.push(redirect)
      }
    } catch (err: any) {
      setError(err?.message === 'NETWORK_ERROR' ? t('networkError') : err?.message || t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='au-form-card'>
      <Link href='/' className='au-form-brand'>
        <span className='au-form-brand-mark'>{initial}</span>
        <span>{siteName}</span>
      </Link>
      <h2 className='au-form-title'>{t('welcome', { siteName })}</h2>
      <p className='au-form-sub'>{t('subtitle')}</p>

      {error && <div className='au-error'>{error}</div>}

      <form onSubmit={handleSubmit} noValidate autoComplete='off'>
        <div className='au-field'>
          <label className='au-label' htmlFor='au-login-email'>
            {t('emailOrUsername')}
          </label>
          <input
            id='au-login-email'
            className='au-input'
            type='text'
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className='au-field'>
          <label className='au-label' htmlFor='au-login-password'>
            {t('password')}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id='au-login-password'
              className='au-input'
              type={showPassword ? 'text' : 'password'}
              placeholder='············'
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type='button'
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 0,
                color: 'var(--au-text-subtle)',
                cursor: 'pointer',
                padding: '0.4rem',
              }}
            >
              <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} />
            </button>
          </div>
        </div>

        <div className='au-row'>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input type='checkbox' />
            <span>{t('rememberMe')}</span>
          </label>
          <Link href='/auth/forgot-password'>{t('forgotPassword')}</Link>
        </div>

        <button type='submit' className='au-button' disabled={loading}>
          {loading ? t('submitting') : t('submit')}
        </button>

        <div className='au-helper'>
          <span>{t('newToPlatform')} </span>
          <Link href='/auth/register'>{t('createAccount')}</Link>
        </div>

        <div className='au-divider'>
          <span>{t('or')}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <SocialButton provider='google' onClick={() => socialLogin('google')} icon='tabler-brand-google-filled' />
          <SocialButton provider='facebook' onClick={() => socialLogin('facebook')} icon='tabler-brand-facebook-filled' />
          <SocialButton provider='apple' onClick={() => socialLogin('apple')} icon='tabler-brand-apple-filled' />
        </div>
      </form>
    </div>
  )
}

function SocialButton({ provider, icon, onClick }: { provider: string; icon: string; onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={provider}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        border: '1px solid var(--au-border)',
        background: '#fff',
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--au-text-muted)',
        fontSize: '1.1rem',
      }}
    >
      <i className={icon} />
    </button>
  )
}
