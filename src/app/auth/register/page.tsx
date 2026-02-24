'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'

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
import themeConfig from '@/configs/themeConfig'

const RegisterPage = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== passwordConfirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      await authApi.register({ email, password, password_confirm: passwordConfirm })
      setSuccess('Account created successfully. Redirecting to login...')
      setTimeout(() => router.push('/auth/login'), 1500)
    } catch (err: any) {
      const message = err?.message || 'Registration failed. Please try again.'
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
          <h2>Adventure starts here 🚀</h2>
          <p>Make your account management easy and fun!</p>
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

          <label className='auth-label'>Password *</label>
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

          <label className='auth-label'>Confirm Password *</label>
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
                <span>I agree to </span>
                <Link className='auth-link' href='/' onClick={e => e.preventDefault()}>
                  privacy policy & terms
                </Link>
              </>
            }
          />

          <Button fullWidth variant='contained' type='submit' disabled={loading} className='auth-button'>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>

          <div className='auth-subtext'>
            <span>Already have an account?</span>
            <Link className='auth-link' href='/auth/login'>
              Sign in instead
            </Link>
          </div>

          <div className='auth-divider'>
            <span>or</span>
          </div>

          <div className='auth-social'>
            <IconButton className='text-facebook' size='small'>
              <Icon icon='tabler-brand-facebook-filled' />
            </IconButton>
            <IconButton className='text-twitter' size='small'>
              <Icon icon='tabler-brand-twitter-filled' />
            </IconButton>
            <IconButton className='text-textPrimary' size='small'>
              <Icon icon='tabler-brand-github-filled' />
            </IconButton>
            <IconButton className='text-error' size='small'>
              <Icon icon='tabler-brand-google-filled' />
            </IconButton>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage

