'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Button from '@mui/material/Button'
import Link from '@components/Link'
import Logo from '@components/Logo'
import { authApi } from '@/utils/authApi'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function AuthVerifyEmailClient() {
  const t = useTranslations('auth.verifyEmail')
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [messageKey, setMessageKey] = useState<'verifying' | 'invalidLink' | 'success' | 'failed'>('verifying')

  const router = useRouter()
  const searchParams = useSearchParams()
  const storefrontConfig = useStorefrontConfigSafe()
  const siteName = storefrontConfig.site_name?.trim() || 'BFG'

  useEffect(() => {
    const key = searchParams.get('key') || searchParams.get('token')

    const verify = async () => {
      if (!key) {
        setStatus('error')
        setMessageKey('invalidLink')
        return
      }

      try {
        await authApi.verifyEmail?.(key)
        setStatus('success')
        setMessageKey('success')
      } catch (err: any) {
        setStatus('error')
        setMessageKey('failed')
      }
    }

    if (typeof authApi.verifyEmail === 'function') {
      verify()
    } else {
      setStatus('success')
      setMessageKey('success')
    }
  }, [searchParams])

  const goLogin = () => router.push('/auth/login')

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

        <div className={`auth-${status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}`}>
          {t(messageKey)}
        </div>

        <div className='auth-form'>
          <Button variant='contained' fullWidth onClick={goLogin}>
            {t('goToLogin')}
          </Button>
          <Button variant='outlined' fullWidth onClick={() => router.push('/auth/register')}>
            {t('createAccount')}
          </Button>
        </div>
      </div>
    </div>
  )
}
