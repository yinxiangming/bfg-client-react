'use client'

import { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Link from '@components/Link'
import Logo from '@components/Logo'
import Icon from '@components/Icon'
import CustomTextField from '@components/ui/TextField'
import { authApi } from '@/utils/authApi'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

export default function AuthResetPasswordClient() {
  const t = useTranslations('auth.resetPassword')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorKey, setErrorKey] = useState<'invalidLink' | 'passwordsDoNotMatch' | 'passwordMinLength' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uid, setUid] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const storefrontConfig = useStorefrontConfigSafe()
  const siteName = storefrontConfig.site_name?.trim() || 'BFG'

  useEffect(() => {
    const uidParam = searchParams.get('uid')
    const tokenParam = searchParams.get('token')
    if (!uidParam || !tokenParam) {
      setErrorKey('invalidLink')
      setUid(null)
      setToken(null)
    } else {
      setErrorKey(null)
      setUid(uidParam)
      setToken(tokenParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorKey(null)
    setErrorMessage(null)

    if (!uid || !token) {
      setErrorKey('invalidLink')
      return
    }

    if (newPassword !== newPasswordConfirm) {
      setErrorKey('passwordsDoNotMatch')
      return
    }

    if (newPassword.length < 8) {
      setErrorKey('passwordMinLength')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPasswordConfirm(uid, token, newPassword, newPasswordConfirm)
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 1500)
    } catch (err: any) {
      setErrorMessage(err?.message || t('failed'))
    } finally {
      setLoading(false)
    }
  }

  const errorDisplay = errorKey ? t(errorKey) : errorMessage

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

        {errorDisplay && <div className='auth-error'>{errorDisplay}</div>}
        {success && <div className='auth-success'>{t('success')}</div>}

        {!success && (
          <form noValidate autoComplete='off' onSubmit={handleSubmit} className='auth-form'>
            <label className='auth-label'>{t('newPassword')}</label>
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

            <label className='auth-label'>{t('confirmNewPassword')}</label>
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
              {loading ? t('submitting') : t('submit')}
            </Button>

            <div className='auth-subtext'>
              <span className='flex items-center gap-1'>
                <Icon icon='tabler-chevron-left' />
              </span>
              <Link className='auth-link' href='/auth/login'>
                {t('backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
