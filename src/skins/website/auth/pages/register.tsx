'use client'

import { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { authApi } from '@/utils/authApi'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

/** Website-skin register page — pure HTML form, no MUI. */
export default function WebsiteRegisterPage() {
  const t = useTranslations('auth.register')
  const router = useRouter()
  const searchParams = useSearchParams()
  const config = useStorefrontConfigSafe()
  const siteName = config?.site_name?.trim() || 'BFG'
  const initial = siteName.charAt(0).toUpperCase()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const inviteToken = searchParams.get('invite_token') || ''
  const inviteUuid = searchParams.get('invite_uuid') || ''
  const prefilledEmail = searchParams.get('email') || ''
  const isInviteFlow = Boolean(inviteToken)

  useEffect(() => {
    if (prefilledEmail && !email) setEmail(prefilledEmail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledEmail])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== passwordConfirm) {
      setError(t('passwordsDoNotMatch'))
      return
    }
    if (password.length < 8) {
      setError(t('passwordMinLength'))
      return
    }

    setLoading(true)
    try {
      await authApi.register({
        email,
        password,
        password_confirm: passwordConfirm,
        ...(inviteToken ? { invite_token: inviteToken, invite_uuid: inviteUuid } : {}),
      })
      setSuccess(t('accountCreated'))
      const next = isInviteFlow
        ? `/auth/invite/accept?token=${encodeURIComponent(inviteToken)}${
            inviteUuid ? `&uuid=${encodeURIComponent(inviteUuid)}` : ''
          }`
        : '/auth/login'
      setTimeout(() => router.push(next), 1500)
    } catch (err: any) {
      setError(err?.message || t('registrationFailed'))
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
      <h2 className='au-form-title'>{t('heading')}</h2>
      <p className='au-form-sub'>{t('subtitle')}</p>

      {error && <div className='au-error'>{error}</div>}
      {success && (
        <div
          className='au-error'
          style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate autoComplete='off'>
        <div className='au-field'>
          <label className='au-label' htmlFor='au-reg-email'>
            {t('email')}
          </label>
          <input
            id='au-reg-email'
            className='au-input'
            type='email'
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            disabled={isInviteFlow}
            autoFocus
          />
        </div>

        <PasswordField
          id='au-reg-password'
          label={t('password')}
          value={password}
          onChange={setPassword}
          shown={showPassword}
          onToggle={() => setShowPassword(s => !s)}
        />

        <PasswordField
          id='au-reg-password-confirm'
          label={t('confirmPassword')}
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          shown={showConfirm}
          onToggle={() => setShowConfirm(s => !s)}
        />

        <button type='submit' className='au-button' disabled={loading}>
          {loading ? t('submitting') : t('submit')}
        </button>

        <div className='au-helper'>
          <span>{t('alreadyHaveAccount')} </span>
          <Link href='/auth/login'>{t('signInInstead')}</Link>
        </div>
      </form>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  shown,
  onToggle,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  shown: boolean
  onToggle: () => void
}) {
  return (
    <div className='au-field'>
      <label className='au-label' htmlFor={id}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          className='au-input'
          type={shown ? 'text' : 'password'}
          placeholder='············'
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          required
          style={{ paddingRight: '2.5rem' }}
        />
        <button
          type='button'
          onClick={onToggle}
          aria-label={shown ? 'Hide password' : 'Show password'}
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
          <i className={shown ? 'tabler-eye-off' : 'tabler-eye'} />
        </button>
      </div>
    </div>
  )
}
