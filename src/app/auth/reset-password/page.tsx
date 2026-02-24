'use client'

import { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'

import Link from '@components/Link'
import Logo from '@components/Logo'
import Icon from '@components/Icon'
import CustomTextField from '@components/ui/TextField'

import { authApi } from '@/utils/authApi'
import themeConfig from '@/configs/themeConfig'

const ResetPasswordPage = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uid, setUid] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const uidParam = searchParams.get('uid')
    const tokenParam = searchParams.get('token')
    if (!uidParam || !tokenParam) {
      setError('Invalid password reset link. Please request a new one.')
    } else {
      setUid(uidParam)
      setToken(tokenParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!uid || !token) {
      setError('Invalid password reset link. Please request a new one.')
      return
    }

    if (newPassword !== newPasswordConfirm) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPasswordConfirm(uid, token, newPassword, newPasswordConfirm)
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 1500)
    } catch (err: any) {
      const message = err?.message || 'Failed to reset password. Please try again.'
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
          <h2>Reset Password 🔒</h2>
          <p>Enter your new password</p>
        </div>

        {error && <div className='auth-error'>{error}</div>}
        {success && <div className='auth-success'>Password has been reset successfully. Redirecting to login...</div>}

        {!success && (
          <form noValidate autoComplete='off' onSubmit={handleSubmit} className='auth-form'>
            <label className='auth-label'>New Password *</label>
            <CustomTextField
              autoFocus
              fullWidth
              placeholder='············'
              type={isPasswordShown ? 'text' : 'password'}
              value={newPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
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

            <label className='auth-label'>Confirm New Password *</label>
            <CustomTextField
              fullWidth
              placeholder='············'
              type={isConfirmPasswordShown ? 'text' : 'password'}
              value={newPasswordConfirm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPasswordConfirm(e.target.value)}
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

            <Button fullWidth variant='contained' type='submit' disabled={loading || !uid || !token} className='auth-button'>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <div className='auth-subtext'>
              <span className='flex items-center gap-1'>
                <Icon icon='tabler-chevron-left' />
              </span>
              <Link className='auth-link' href='/auth/login'>
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage

