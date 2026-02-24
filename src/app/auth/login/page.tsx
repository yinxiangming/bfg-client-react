'use client'

// React Imports
import { useState } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'

// Next Imports
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/Logo'
import CustomTextField from '@components/ui/TextField'
import Icon from '@components/Icon'

// Utils Imports
import { authApi } from '@/utils/authApi'

// Config Imports
import themeConfig from '@/configs/themeConfig'

const LoginPage = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await authApi.login({ email, password })
      // Redirect to the original page or default to /account
      const redirect = searchParams.get('redirect')
      if (redirect) {
        // Decode the redirect URL and navigate
        const decodedRedirect = decodeURIComponent(redirect)
        // Use router.push for client-side navigation
        router.push(decodedRedirect)
      } else {
        // Default to account page
        router.push('/account')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please check your credentials.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='auth-shell'>
      <Link className='auth-logo' href='/'>
        <Logo skipLink={true} />        
      </Link>

      <div className='auth-card'>
        <div className='auth-header'>
          <h2>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</h2>
          <p>Please sign-in to your account and start the adventure</p>
        </div>

        {error && <div className='auth-error'>{error}</div>}

        <form noValidate autoComplete='off' onSubmit={handleSubmit} className='auth-form'>
          <label className='auth-label'>Email or Username *</label>
          <CustomTextField
            autoFocus
            fullWidth
            placeholder='Enter your email or username'
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />

          <label className='auth-label'>Password *</label>
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
            <FormControlLabel control={<Checkbox size='small' />} label='Remember me' />
            <Link className='auth-link' href='/auth/forgot-password'>
              Forgot password?
            </Link>
          </div>

          <Button fullWidth variant='contained' type='submit' disabled={loading} className='auth-button'>
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <div className='auth-subtext'>
            <span>New on our platform?</span>
            <Link className='auth-link' href='/auth/register'>
              Create an account
            </Link>
          </div>

          <div className='auth-divider'>
            <span>or</span>
          </div>

          <div className='auth-social'>
            <IconButton className='text-facebook' size='small'>
              <i className='tabler-brand-facebook-filled' />
            </IconButton>
            <IconButton className='text-twitter' size='small'>
              <i className='tabler-brand-twitter-filled' />
            </IconButton>
            <IconButton className='text-textPrimary' size='small'>
              <i className='tabler-brand-github-filled' />
            </IconButton>
            <IconButton className='text-error' size='small'>
              <i className='tabler-brand-google-filled' />
            </IconButton>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
