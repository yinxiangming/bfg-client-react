'use client'

import { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@components/Link'
import Logo from '@components/Logo'
import Icon from '@components/Icon'
import CustomTextField from '@components/ui/TextField'
import { authApi } from '@/utils/authApi'
import { getApiBaseUrl } from '@/utils/api'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { useSocialProviders } from '@/hooks/useSocialProviders'

export default function AuthRegisterClient() {
  const t = useTranslations('auth.register')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const storefrontConfig = useStorefrontConfigSafe()
  const siteName = storefrontConfig.site_name?.trim() || 'BFG'

  const inviteToken = searchParams.get('invite_token') || ''
  const inviteUuid = searchParams.get('invite_uuid') || ''
  const prefilledEmail = searchParams.get('email') || ''
  const isInviteFlow = Boolean(inviteToken)

  const redirect = searchParams.get('redirect') ? decodeURIComponent(searchParams.get('redirect')!) : '/account'
  const host = typeof window !== 'undefined' ? window.location.host : ''
  const enabledProviders = useSocialProviders()

  const socialLogin = (provider: string) => {
    const apiBase = getApiBaseUrl().replace(/\/+$/, '')
    const params = new URLSearchParams({ redirect, host })
    window.location.href = `${apiBase}/api/v1/auth/${provider}/login/?${params}`
  }

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
        ? `/auth/invite/accept?token=${encodeURIComponent(inviteToken)}${inviteUuid ? `&uuid=${encodeURIComponent(inviteUuid)}` : ''}`
        : '/auth/login'
      setTimeout(() => router.push(next), 1500)
    } catch (err: any) {
      setError(err?.message || t('registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='auth-shell'>
      <Link className='auth-logo' href='/'>
        <Logo skipLink={true} name={siteName} />
      </Link>

      <div className='auth-card'>
        <div className='auth-header'>
          <h2>{t('heading')}</h2>
          <p>{t('subtitle')}</p>
        </div>

        {error && <div className='auth-error'>{error}</div>}
        {success && <div className='auth-success'>{success}</div>}

        <form noValidate autoComplete='off' onSubmit={handleSubmit} className='auth-form'>
          <label className='auth-label'>{t('email')}</label>
          <CustomTextField
            autoFocus
            fullWidth
            placeholder={t('emailPlaceholder')}
            type='email'
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            disabled={isInviteFlow}
          />

          <label className='auth-label'>{t('password')}</label>
          <CustomTextField
            fullWidth
            placeholder='············'
            type={isPasswordShown ? 'text' : 'password'}
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      edge='end'
                      onClick={() => setIsPasswordShown(show => !show)}
                      onMouseDown={(e: MouseEvent) => e.preventDefault()}
                    >
                      <Icon icon={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          <label className='auth-label'>{t('confirmPassword')}</label>
          <CustomTextField
            fullWidth
            placeholder='············'
            type={isConfirmPasswordShown ? 'text' : 'password'}
            value={passwordConfirm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPasswordConfirm(e.target.value)}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      edge='end'
                      onClick={() => setIsConfirmPasswordShown(show => !show)}
                      onMouseDown={(e: MouseEvent) => e.preventDefault()}
                    >
                      <Icon icon={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          <FormControlLabel
            control={<Checkbox size='small' />}
            label={
              <>
                <Link className='auth-link' href='/' onClick={e => e.preventDefault()}>
                  {t('privacyAndTerms')}
                </Link>
              </>
            }
          />

          <Button fullWidth variant='contained' type='submit' disabled={loading} className='auth-button'>
            {loading ? t('submitting') : t('submit')}
          </Button>

          <div className='auth-subtext'>
            <span>{t('alreadyHaveAccount')}</span>
            <Link className='auth-link' href='/auth/login'>
              {t('signInInstead')}
            </Link>
          </div>

          {enabledProviders && enabledProviders.length > 0 && (
            <>
              <div className='auth-divider'>
                <span>{t('or')}</span>
              </div>
              <div className='auth-social'>
                {enabledProviders.includes('google') && (
                  <IconButton
                    className='text-error'
                    size='small'
                    onClick={() => socialLogin('google')}
                    aria-label='Google'
                  >
                    <Icon icon='tabler-brand-google-filled' />
                  </IconButton>
                )}
                {enabledProviders.includes('facebook') && (
                  <IconButton
                    className='text-facebook'
                    size='small'
                    onClick={() => socialLogin('facebook')}
                    aria-label='Facebook'
                  >
                    <Icon icon='tabler-brand-facebook-filled' />
                  </IconButton>
                )}
                {enabledProviders.includes('apple') && (
                  <IconButton
                    className='text-textPrimary'
                    size='small'
                    onClick={() => socialLogin('apple')}
                    aria-label='Apple'
                  >
                    <Icon icon='tabler-brand-apple-filled' />
                  </IconButton>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
