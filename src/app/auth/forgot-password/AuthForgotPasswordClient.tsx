'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import Button from '@mui/material/Button'
import Link from '@components/Link'
import Logo from '@components/Logo'
import CustomTextField from '@components/ui/TextField'
import { authApi } from '@/utils/authApi'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function AuthForgotPasswordClient() {
  const t = useTranslations('auth.forgotPassword')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const storefrontConfig = useStorefrontConfigSafe()
  const siteName = storefrontConfig.site_name?.trim() || 'BFG'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setSuccess(t('resetLinkSent'))
    } catch (err: any) {
      setError(err?.message || t('resetFailed'))
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
          />

          <Button fullWidth variant='contained' type='submit' disabled={loading} className='auth-button'>
            {loading ? t('submitting') : t('submit')}
          </Button>

          <div className='auth-subtext'>
            <span>{t('rememberPassword')}</span>
            <Link className='auth-link' href='/auth/login'>
              {t('backToLogin')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
