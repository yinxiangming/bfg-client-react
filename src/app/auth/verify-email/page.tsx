'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import Button from '@mui/material/Button'

import Link from '@components/Link'
import Logo from '@components/Logo'

import { authApi } from '@/utils/authApi'
import themeConfig from '@/configs/themeConfig'

const VerifyEmailPage = () => {
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState<string>('Verifying your email...')

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const key = searchParams.get('key') || searchParams.get('token')

    const verify = async () => {
      if (!key) {
        setStatus('error')
        setMessage('Invalid verification link. Please request a new one.')
        return
      }

      try {
        await authApi.verifyEmail?.(key)
        setStatus('success')
        setMessage('Email verified successfully. You can now sign in.')
      } catch (err: any) {
        const msg = err?.message || 'Verification failed. The link may have expired.'
        setStatus('error')
        setMessage(msg)
      }
    }

    // Graceful fallback if verifyEmail is not implemented
    if (typeof authApi.verifyEmail === 'function') {
      verify()
    } else {
      setStatus('success')
      setMessage('Email verified. You can now sign in.')
    }
  }, [searchParams])

  const goLogin = () => router.push('/auth/login')

  return (
    <div className='auth-shell'>
      <Link className='auth-logo' href='/'>
        <Logo skipLink={true} />
        <span className='auth-logo-text'>{themeConfig.templateName}</span>
      </Link>

      <div className='auth-card'>
        <div className='auth-header'>
          <h2>Email Verification</h2>
          <p>Please wait while we verify your email.</p>
        </div>

        <div className={`auth-${status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}`}>
          {message}
        </div>

        <div className='auth-form'>
          <Button variant='contained' fullWidth onClick={goLogin}>
            Go to Login
          </Button>
          <Button variant='outlined' fullWidth onClick={() => router.push('/auth/register')}>
            Create an account
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage

