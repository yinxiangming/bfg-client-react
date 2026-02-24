'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'

import Link from '@components/Link'
import Logo from '@components/Logo'
import CustomTextField from '@components/ui/TextField'

import { authApi } from '@/utils/authApi'
import themeConfig from '@/configs/themeConfig'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setSuccess('Reset link sent. Please check your inbox.')
    } catch (err: any) {
      const message = err?.message || 'Failed to send reset email.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='auth-shell'>
      <Link className='auth-logo' href='/'>
        <Logo skipLink={true} />
        <span className='auth-logo-text'>{themeConfig.templateName}</span>
      </Link>

      <div className='auth-card'>
        <div className='auth-header'>
          <h2>Forgot Password 🔒</h2>
          <p>Enter your email and we’ll send you instructions to reset your password</p>
        </div>

        {error && <div className='auth-error'>{error}</div>}
        {success && <div className='auth-success'>{success}</div>}

        <form noValidate autoComplete='off' onSubmit={handleSubmit} className='auth-form'>
          <label className='auth-label'>Email *</label>
          <CustomTextField
            autoFocus
            fullWidth
            placeholder='Enter your email'
            type='email'
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />

          <Button fullWidth variant='contained' type='submit' disabled={loading} className='auth-button'>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>

          <div className='auth-subtext'>
            <span>Remember your password?</span>
            <Link className='auth-link' href='/auth/login'>
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPasswordPage

