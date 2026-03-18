'use client'

import { useState } from 'react'
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
import CustomTextField from '@components/ui/TextField'
import Icon from '@components/Icon'
import { authApi } from '@/utils/authApi'
import { getApiBaseUrl } from '@/utils/api'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function AuthLoginClient() {
  const t = useTranslations('auth.login')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const storefrontConfig = useStorefrontConfigSafe()
  const siteName = storefrontConfig.site_name?.trim() || 'BFG'

  const redirect = searchParams.get('redirect') ? decodeURIComponent(searchParams.get('redirect')!) : '/account'
  const host = typeof window !== 'undefined' ? window.location.host : ''

  const socialLogin = (provider: string) => {
    const apiBase = getApiBaseUrl().replace(/\/+$/, '')
    const params = new URLSearchParams({ redirect, host })
    window.location.href = `${apiBase}/api/v1/auth/${provider}/login/?${params}`
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await authApi.login({ email, password })
      const redirect = searchParams.get('redirect')
      if (redirect) {
        router.push(decodeURIComponent(redirect))
      } else {
        router.push('/account')
      }
    } catch (err: any) {
      setError(err?.message === 'NETWORK_ERROR' ? t('networkError') : (err?.message || t('loginFailed')))
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
          <h2>{t('welcome', { siteName })}</h2>
          <p>{t('subtitle')}</p>
        </div>

        {error && <div className='auth-error'>{error}</div>}

        <form noValidate autoComplete='off' onSubmit={handleSubmit} className='auth-form'>
          <label className='auth-label'>{t('emailOrUsername')}</label>
          <CustomTextField
            autoFocus
            fullWidth
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />

          <label className='auth-label'>{t('password')}</label>
          <CustomTextField
            fullWidth
            placeholder='············'
            id='outlined-adornment-password'
            type={isPasswordShown ? 'text' : 'password'}
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='tabler-lock' />
                  </InputAdornment>
                ),
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

          <div className='auth-row'>
            <FormControlLabel control={<Checkbox size='small' />} label={t('rememberMe')} />
            <Link className='auth-link' href='/auth/forgot-password'>
              {t('forgotPassword')}
            </Link>
          </div>

          <Button fullWidth variant='contained' type='submit' disabled={loading} className='auth-button'>
            {loading ? t('submitting') : t('submit')}
          </Button>

          <div className='auth-subtext'>
            <span>{t('newToPlatform')}</span>
            <Link className='auth-link' href='/auth/register'>
              {t('createAccount')}
            </Link>
          </div>

          <div className='auth-divider'>
            <span>{t('or')}</span>
          </div>

          <div className='auth-social'>
            <IconButton
              className='text-error'
              size='small'
              onClick={() => socialLogin('google')}
              aria-label='Google'
            >
              <i className='tabler-brand-google-filled' />
            </IconButton>
            <IconButton
              className='text-facebook'
              size='small'
              onClick={() => socialLogin('facebook')}
              aria-label='Facebook'
            >
              <i className='tabler-brand-facebook-filled' />
            </IconButton>
            <IconButton
              className='text-textPrimary'
              size='small'
              onClick={() => socialLogin('apple')}
              aria-label='Apple'
            >
              <i className='tabler-brand-apple-filled' />
            </IconButton>
          </div>
        </form>
      </div>
    </div>
  )
}
