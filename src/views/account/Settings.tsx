'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

// Next Imports
import Link from 'next/link'
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Switch from '@mui/material/Switch'

// Component Imports
import Icon from '@components/Icon'
import CustomTextField from '@components/ui/TextField'
import StatusBadge from '@/components/schema/StatusBadge'
import { AccountCard, AccountLoading } from '@/components/account/AccountUI'

// Utils Imports
import { useAccount } from '@/contexts/AccountContext'
import { routing } from '@/i18n/routing'
import { getAvatarUrl } from '@/utils/media'
import { meApi } from '@/utils/meApi'

type Profile = {
  first_name: string
  last_name: string
  email: string
  phone: string
  language: string
  timezone_name: string
}

type Visibility = 'public' | 'private' | 'friends'

/** The `/me/settings/` fields this page edits. */
type Preferences = {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  notify_order_updates: boolean
  notify_promotions: boolean
  notify_product_updates: boolean
  notify_support_replies: boolean
  profile_visibility: Visibility
  show_email: boolean
  show_phone: boolean
}

type ToggleKey = Exclude<keyof Preferences, 'profile_visibility'>

const LANGUAGE_LABELS: Record<string, string> = { en: 'English', 'zh-hans': '简体中文' }

const TIMEZONES = [
  'UTC',
  'Pacific/Auckland',
  'Australia/Sydney',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles'
]

const TOPICS: { key: ToggleKey; label: string }[] = [
  { key: 'notify_order_updates', label: 'orderUpdates' },
  { key: 'notify_promotions', label: 'promotions' },
  { key: 'notify_product_updates', label: 'productUpdates' },
  { key: 'notify_support_replies', label: 'supportReplies' }
]

const toProfile = (data: any): Profile => ({
  first_name: data?.first_name ?? '',
  last_name: data?.last_name ?? '',
  email: data?.email ?? '',
  phone: data?.phone ?? '',
  language: data?.language ?? '',
  timezone_name: data?.timezone_name ?? ''
})

const toPreferences = (data: any): Preferences => ({
  email_notifications: Boolean(data?.email_notifications),
  sms_notifications: Boolean(data?.sms_notifications),
  push_notifications: Boolean(data?.push_notifications),
  notify_order_updates: Boolean(data?.notify_order_updates),
  notify_promotions: Boolean(data?.notify_promotions),
  notify_product_updates: Boolean(data?.notify_product_updates),
  notify_support_replies: Boolean(data?.notify_support_replies),
  profile_visibility: (['public', 'private', 'friends'].includes(data?.profile_visibility)
    ? data.profile_visibility
    : 'private') as Visibility,
  show_email: Boolean(data?.show_email),
  show_phone: Boolean(data?.show_phone)
})

const Settings = () => {
  const t = useTranslations('account.settings')
  const { refreshUser } = useAccount()
  const fileInput = useRef<HTMLInputElement>(null)

  const [saved, setSaved] = useState<Profile | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    meApi
      .getMe()
      .then(data => {
        setSaved(toProfile(data))
        setProfile(toProfile(data))
        setAvatarUrl(data?.avatar || undefined)
        setVerified(Boolean(data?.customer?.is_verified))
      })
      .catch(err => setError(err instanceof Error ? err.message : t('failedLoad')))
    meApi
      .getSettings()
      .then(data => setPreferences(toPreferences(data)))
      .catch(err => setError(err instanceof Error ? err.message : t('failedLoad')))
  }, [t])

  useEffect(() => {
    if (!avatarPreview) return

    return () => URL.revokeObjectURL(avatarPreview)
  }, [avatarPreview])

  const update = (field: keyof Profile, value: string) => setProfile(current => current && { ...current, [field]: value })

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const discard = () => {
    setProfile(saved)
    setAvatarFile(null)
    setAvatarPreview(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  const saveProfile = async () => {
    if (!profile) return

    setSaving(true)
    setError(null)

    try {
      const response = await meApi.updateMe(avatarFile ? { ...profile, avatar: avatarFile } : profile)

      setSaved(profile)
      setAvatarFile(null)
      setAvatarPreview(null)
      if (response?.avatar) setAvatarUrl(response.avatar)
      setNotice(t('profileCard.saved'))
      refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedUpdate'))
    } finally {
      setSaving(false)
    }
  }

  /** Switches save as they change; a failed save puts the switch back. */
  const savePreference = async (patch: Partial<Preferences>) => {
    if (!preferences) return

    const previous = preferences

    setPreferences({ ...preferences, ...patch })

    try {
      await meApi.updateSettings(patch)
      setNotice(t('savedToast'))
    } catch (err) {
      setPreferences(previous)
      setError(err instanceof Error ? err.message : t('failedUpdate'))
    }
  }

  const toggleRow = (key: ToggleKey, label: string, hint?: string) =>
    preferences && (
      <div key={key} className='acc-row'>
        <div className='acc-grow'>
          <div className='acc-medium'>{label}</div>
          {hint && <div className='acc-sub acc-truncate'>{hint}</div>}
        </div>
        <Switch
          checked={preferences[key]}
          onChange={event => savePreference({ [key]: event.target.checked } as Partial<Preferences>)}
          inputProps={{ 'aria-label': label }}
        />
      </div>
    )

  const dirty = Boolean(avatarFile) || JSON.stringify(profile) !== JSON.stringify(saved)
  const displayName = [saved?.first_name, saved?.last_name].filter(Boolean).join(' ')
  const avatar = avatarPreview || getAvatarUrl(avatarUrl)
  const avatarInitials = (displayName || saved?.email || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
  const zones = profile?.timezone_name && !TIMEZONES.includes(profile.timezone_name) ? [profile.timezone_name, ...TIMEZONES] : TIMEZONES

  return (
    <>
      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className='acc-grid'>
        <div className='acc-col'>
          <AccountCard title={t('profileCard.title')}>
            {!profile || !saved ? (
              <AccountLoading />
            ) : (
              <>
                <div className='acc-row'>
                  <span className='acc-avatar'>{avatar ? <img src={avatar} alt='' /> : avatarInitials}</span>
                  <div className='acc-grow'>
                    <div className='acc-strong acc-truncate'>{displayName || saved.email}</div>
                    <div className='acc-sub'>{t('profileCard.photoHint')}</div>
                  </div>
                  <input ref={fileInput} hidden type='file' accept='image/png, image/jpeg' onChange={chooseAvatar} />
                  <Button size='small' variant='outlined' onClick={() => fileInput.current?.click()}>
                    {t('profileCard.changePhoto')}
                  </Button>
                </div>
                <div className='acc-form-grid acc-divided'>
                  <CustomTextField
                    fullWidth
                    label={t('profileCard.firstName')}
                    value={profile.first_name}
                    onChange={event => update('first_name', event.target.value)}
                  />
                  <CustomTextField
                    fullWidth
                    label={t('profileCard.lastName')}
                    value={profile.last_name}
                    onChange={event => update('last_name', event.target.value)}
                  />
                  <CustomTextField
                    fullWidth
                    type='email'
                    label={t('profileCard.email')}
                    value={profile.email}
                    onChange={event => update('email', event.target.value)}
                  />
                  <CustomTextField
                    fullWidth
                    label={t('profileCard.phone')}
                    value={profile.phone}
                    onChange={event => update('phone', event.target.value)}
                  />
                  <CustomTextField
                    select
                    fullWidth
                    label={t('profileCard.language')}
                    value={profile.language}
                    onChange={event => update('language', event.target.value)}
                  >
                    {!profile.language && <MenuItem value=''>—</MenuItem>}
                    {routing.locales.map(locale => (
                      <MenuItem key={locale} value={locale}>
                        {LANGUAGE_LABELS[locale] ?? locale}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                  <CustomTextField
                    select
                    fullWidth
                    label={t('profileCard.timezone')}
                    value={profile.timezone_name}
                    onChange={event => update('timezone_name', event.target.value)}
                  >
                    {!profile.timezone_name && <MenuItem value=''>—</MenuItem>}
                    {zones.map(zone => (
                      <MenuItem key={zone} value={zone}>
                        {zone}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                </div>
                <div className='acc-card-foot acc-card-foot--end'>
                  <Button onClick={discard} disabled={!dirty || saving}>
                    {t('profileCard.cancel')}
                  </Button>
                  <Button variant='contained' onClick={saveProfile} disabled={!dirty || saving}>
                    {saving ? t('profileCard.saving') : t('profileCard.save')}
                  </Button>
                </div>
              </>
            )}
          </AccountCard>

          <AccountCard title={t('notifications.title')} subtitle={t('notifications.subtitle')}>
            {!preferences ? (
              <AccountLoading />
            ) : (
              <div className='acc-split'>
                <div>
                  <div className='acc-group-label'>{t('notifications.channels')}</div>
                  {toggleRow('email_notifications', t('notifications.email'), saved?.email)}
                  {toggleRow('sms_notifications', t('notifications.sms'), saved?.phone || undefined)}
                  {toggleRow('push_notifications', t('notifications.push'), t('notifications.pushHint'))}
                </div>
                <div>
                  <div className='acc-group-label'>{t('notifications.topics')}</div>
                  {TOPICS.map(topic =>
                    toggleRow(topic.key, t(`notifications.${topic.label}`), t(`notifications.${topic.label}Hint`))
                  )}
                </div>
              </div>
            )}
          </AccountCard>
        </div>

        <div className='acc-col'>
          <AccountCard title={t('securityCard.title')}>
            <div className='acc-row'>
              <span className='acc-ico acc-ico--sm acc-ico--neu'>
                <Icon icon='tabler-lock' />
              </span>
              <div className='acc-grow'>
                <div className='acc-medium'>{t('securityCard.password')}</div>
                <div className='acc-sub'>{t('securityCard.passwordHint')}</div>
              </div>
              <Button size='small' variant='outlined' component={Link} href='/account/change-password'>
                {t('securityCard.change')}
              </Button>
            </div>
            <div className='acc-row'>
              <span className='acc-ico acc-ico--sm acc-ico--neu'>
                <Icon icon='tabler-mail' />
              </span>
              <div className='acc-grow'>
                <div className='acc-medium'>{t('securityCard.email')}</div>
                <div className='acc-sub acc-truncate'>{saved?.email || '—'}</div>
              </div>
              {verified && <StatusBadge label={t('securityCard.verified')} color='success' />}
            </div>
          </AccountCard>

          <AccountCard title={t('privacyCard.title')}>
            {!preferences ? (
              <AccountLoading />
            ) : (
              <>
                <div className='acc-row'>
                  <div className='acc-grow'>
                    <div className='acc-medium'>{t('privacyCard.visibility')}</div>
                    <div className='acc-sub'>{t('privacyCard.visibilityHint')}</div>
                  </div>
                  <CustomTextField
                    select
                    size='small'
                    value={preferences.profile_visibility}
                    onChange={event => savePreference({ profile_visibility: event.target.value as Visibility })}
                    sx={{ minWidth: 120 }}
                  >
                    {(['private', 'friends', 'public'] as const).map(option => (
                      <MenuItem key={option} value={option}>
                        {t(`privacyCard.${option}`)}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                </div>
                {toggleRow('show_email', t('privacyCard.showEmail'), t('privacyCard.showHint'))}
                {toggleRow('show_phone', t('privacyCard.showPhone'), t('privacyCard.showHint'))}
              </>
            )}
          </AccountCard>

          <AccountCard title={t('dataCard.title')}>
            <div className='acc-row'>
              <span className='acc-ico acc-ico--sm acc-ico--neu'>
                <Icon icon='tabler-database' />
              </span>
              <div className='acc-grow'>
                <div className='acc-medium'>{t('dataCard.request')}</div>
                <div className='acc-sub'>{t('dataCard.requestHint')}</div>
              </div>
              <Button size='small' variant='outlined' component={Link} href='/account/support?topic=data'>
                {t('dataCard.contact')}
              </Button>
            </div>
          </AccountCard>
        </div>
      </div>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={2500}
        onClose={() => setNotice(null)}
        message={notice}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}

export default Settings
