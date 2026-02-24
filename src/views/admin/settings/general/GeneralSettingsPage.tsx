'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ChangeEvent, SyntheticEvent, FormEvent } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

// Component Imports
import CustomTextField from '@/components/ui/TextField'
import CustomTabList from '@/components/ui/TabList'
import UsersListTable from './UsersListTable'
import RolesListTable from './RolesListTable'
import EmailTab from './EmailTab'
import {
  getWorkspaceSettings,
  updateGeneralSettings,
  updateStorefrontUiSettings,
  type GeneralSettingsPayload,
  type StorefrontUiSettingsPayload,
  type StorefrontHeaderOptionsPayload
} from '@/services/settings'
import { clearStorefrontConfigCache } from '@/utils/storefrontConfig'
import { THEME_REGISTRY } from '@/components/storefront/themes/registry.generated'
import { bfgApi } from '@/utils/api'
import { usePageSections } from '@/extensions/hooks/usePageSections'

const THEME_IDS = Object.keys(THEME_REGISTRY).sort()
function themeDisplayName(themeId: string): string {
  return themeId.charAt(0).toUpperCase() + themeId.slice(1)
}

import { DEFAULT_AVATAR_URL } from '@/utils/media'

const DEFAULT_AVATAR = DEFAULT_AVATAR_URL

type BasicData = {
  siteName: string
  siteDescription: string
  defaultLanguage: string
  defaultCurrency: string
  defaultTimezone: string
  contactEmail: string
  contactPhone: string
  facebookUrl: string
  twitterUrl: string
  instagramUrl: string
  topBarAnnouncement: string
  footerCopyright: string
  siteAnnouncement: string
  footerContact: string
}

const defaultHeaderOptions: StorefrontHeaderOptionsPayload = {
  show_search: true,
  show_cart: true,
  show_language_switcher: true,
  show_style_selector: true,
  show_login: true
}

type StorefrontUiData = {
  theme: string
  header_options: StorefrontHeaderOptionsPayload
}

const initialStorefrontUi: StorefrontUiData = {
  theme: THEME_IDS[0] ?? 'store',
  header_options: { ...defaultHeaderOptions }
}

// Vars
const initialBasicData: BasicData = {
  siteName: '',
  siteDescription: '',
  defaultLanguage: 'en',
  defaultCurrency: 'NZD',
  defaultTimezone: 'Pacific/Auckland',
  contactEmail: '',
  contactPhone: '',
  facebookUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  topBarAnnouncement: '',
  footerCopyright: '',
  siteAnnouncement: '',
  footerContact: ''
}

const GeneralSettingsPage = () => {
  const t = useTranslations('admin')
  const { beforeSections, afterSections } = usePageSections('admin/settings/general')
  // States
  const [activeTab, setActiveTab] = useState('basic')
  const [basicData, setBasicData] = useState<BasicData>(initialBasicData)
  const [fileInput, setFileInput] = useState<string>('')
  const [imgSrc, setImgSrc] = useState<string>(DEFAULT_AVATAR)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [settingsId, setSettingsId] = useState<number | null>(null)
  const [storefrontUi, setStorefrontUi] = useState<StorefrontUiData>(initialStorefrontUi)

  const handleTabChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  const handleBasicChange = (field: keyof BasicData, value: BasicData[keyof BasicData]) => {
    setBasicData({ ...basicData, [field]: value })
  }

  const handleStorefrontUiChange = (field: keyof StorefrontUiData, value: StorefrontUiData[keyof StorefrontUiData]) => {
    setStorefrontUi(prev => ({ ...prev, [field]: value }))
  }

  const handleHeaderOptionChange = (key: keyof StorefrontHeaderOptionsPayload, checked: boolean) => {
    setStorefrontUi(prev => ({
      ...prev,
      header_options: { ...prev.header_options, [key]: checked }
    }))
  }

  const handleFileInputChange = (file: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = file.target as HTMLInputElement

    if (files && files.length !== 0) {
      reader.onload = () => {
        setImgSrc(reader.result as string)
        setFileInput(reader.result as string)
      }
      reader.readAsDataURL(files[0])
    }
  }

  const handleFileInputReset = () => {
    setFileInput('')
    setImgSrc(DEFAULT_AVATAR)
    // Reset file input
    const fileInputElement = document.getElementById('general-settings-upload-image') as HTMLInputElement
    if (fileInputElement) {
      fileInputElement.value = ''
    }
  }

  // Load initial data
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        console.log('[GeneralSettings] Loading settings...')
        const settings = await getWorkspaceSettings()
        console.log('[GeneralSettings] Settings loaded:', settings)
        setSettingsId(settings.id)
        console.log('[GeneralSettings] Settings ID set to:', settings.id)
        
        const storefront_ui = (settings.custom_settings as any)?.storefront_ui || {}
        if (storefront_ui && Object.keys(storefront_ui).length > 0) {
          const themeId = storefront_ui.theme ?? 'store'
          setStorefrontUi({
            theme: THEME_IDS.includes(themeId) ? themeId : THEME_IDS[0] ?? 'store',
            header_options: { ...defaultHeaderOptions, ...(storefront_ui.header_options || {}) }
          })
        }

        const general = (settings.custom_settings as any)?.general || {}
        if (general) {
          setBasicData({
            siteName: general.site_name || initialBasicData.siteName,
            siteDescription: general.site_description || initialBasicData.siteDescription,
            defaultLanguage: general.default_language || initialBasicData.defaultLanguage,
            defaultCurrency: general.default_currency || initialBasicData.defaultCurrency,
            defaultTimezone: general.default_timezone || initialBasicData.defaultTimezone,
            contactEmail: general.contact_email || initialBasicData.contactEmail,
            contactPhone: general.contact_phone || initialBasicData.contactPhone,
            facebookUrl: general.facebook_url || initialBasicData.facebookUrl,
            twitterUrl: general.twitter_url || initialBasicData.twitterUrl,
            instagramUrl: general.instagram_url || initialBasicData.instagramUrl,
            topBarAnnouncement: general.top_bar_announcement || initialBasicData.topBarAnnouncement,
            footerCopyright: general.footer_copyright || initialBasicData.footerCopyright,
            siteAnnouncement: general.site_announcement || initialBasicData.siteAnnouncement,
            footerContact: general.footer_contact || initialBasicData.footerContact
          })
          
          if (general.logo) {
            setImgSrc(general.logo)
          }
        } else {
          console.log('[GeneralSettings] No general settings found, using defaults')
        }
      } catch (err: any) {
        console.error('[GeneralSettings] Load error:', err)
        setError(t('settings.general.basic.errors.loadFailed', { error: err.message }))
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    console.log('[GeneralSettings] handleSubmit called', { settingsId, basicData })
    
    // If settingsId is not loaded, try to load it first
    let currentSettingsId = settingsId
    if (!currentSettingsId) {
      try {
        console.log('[GeneralSettings] Settings ID not found, loading settings...')
        const settings = await getWorkspaceSettings()
        console.log('[GeneralSettings] Settings object:', settings)
        console.log('[GeneralSettings] Settings keys:', Object.keys(settings || {}))
        console.log('[GeneralSettings] Settings.id:', settings?.id)
        
        if (!settings || !settings.id) {
          throw new Error('Settings object does not have an id field. Response: ' + JSON.stringify(settings))
        }
        
        currentSettingsId = settings.id
        setSettingsId(currentSettingsId)
        console.log('[GeneralSettings] Settings ID loaded:', currentSettingsId)
      } catch (err: any) {
        console.error('[GeneralSettings] Failed to load settings:', err)
        setError(t('settings.general.basic.errors.loadFailedWithRefresh', { error: err.message }))
        return
      }
    }

    if (!currentSettingsId) {
      const errorMsg = t('settings.general.basic.errors.settingsIdMissing')
      console.error('[GeneralSettings]', errorMsg)
      setError(errorMsg)
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const payload: GeneralSettingsPayload = {
        site_name: basicData.siteName,
        site_description: basicData.siteDescription,
        default_language: basicData.defaultLanguage,
        default_currency: basicData.defaultCurrency,
        default_timezone: basicData.defaultTimezone,
        contact_email: basicData.contactEmail,
        contact_phone: basicData.contactPhone,
        facebook_url: basicData.facebookUrl,
        twitter_url: basicData.twitterUrl,
        instagram_url: basicData.instagramUrl,
        top_bar_announcement: basicData.topBarAnnouncement,
        footer_copyright: basicData.footerCopyright,
        site_announcement: basicData.siteAnnouncement,
        footer_contact: basicData.footerContact,
        logo: fileInput || undefined
      }
      
      console.log('[GeneralSettings] Sending payload:', payload)
      console.log('[GeneralSettings] API URL will be:', `${bfgApi.settings()}${currentSettingsId}/`)
      
      await updateGeneralSettings(currentSettingsId, payload)

      const storefrontPayload: StorefrontUiSettingsPayload = {
        theme: storefrontUi.theme || undefined,
        header_options: storefrontUi.header_options
      }
      await updateStorefrontUiSettings(currentSettingsId, storefrontPayload)

      console.log('[GeneralSettings] Save successful')
      clearStorefrontConfigCache()
      setSuccess(true)

      // Update fileInput to empty after successful save
      if (fileInput) {
        setFileInput('')
        const fileInputElement = document.getElementById('general-settings-upload-image') as HTMLInputElement
        if (fileInputElement) {
          fileInputElement.value = ''
        }
      }
    } catch (err: any) {
      console.error('[GeneralSettings] Save error:', err)
      setError(t('settings.general.basic.errors.saveFailed', { error: err.message }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={3}>
      {/* Page Header */}
      <Grid size={{ xs: 12 }}>
        <div>
          <Typography variant='h4' sx={{ mb: 1 }}>
            {t('settings.general.page.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.page.subtitle')}
          </Typography>
        </div>
      </Grid>

      {error && (
        <Grid size={{ xs: 12 }}>
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grid>
      )}

      {beforeSections.map(
        ext =>
          ext.component && (
            <Grid key={ext.id} size={{ xs: 12 }}>
              <ext.component />
            </Grid>
          )
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          <TabContext value={activeTab}>
            <CardContent>
              <CustomTabList onChange={handleTabChange} variant='scrollable' pill='true'>
                <Tab label={t('settings.general.page.tabs.basic')} icon={<i className='tabler-settings' />} iconPosition='start' value='basic' />
                <Tab label={t('settings.general.page.tabs.users')} icon={<i className='tabler-users' />} iconPosition='start' value='users' />
                <Tab label={t('settings.general.page.tabs.roles')} icon={<i className='tabler-shield' />} iconPosition='start' value='roles' />
                <Tab label={t('settings.general.page.tabs.email')} icon={<i className='tabler-mail' />} iconPosition='start' value='email' />
              </CustomTabList>
            </CardContent>

            {/* Basic Tab */}
            <TabPanel value='basic' className='p-0'>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  {/* Site Information Section */}
                  <Card variant='outlined' sx={{ mb: 6 }}>
                    <CardContent>
                      <Typography variant='h6' sx={{ mb: 4 }}>
                        {t('settings.general.basic.sections.siteInformation')}
                      </Typography>
                      
                      {/* Logo Upload Section */}
                      <Grid container spacing={4} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, sm: 'auto' }}>
                          <div className='flex items-center justify-center'>
                            <img 
                              height={120} 
                              width={120} 
                              className='rounded' 
                              src={imgSrc} 
                              alt={t('settings.general.basic.logo.alt')}
                              style={{ objectFit: 'cover', border: '1px solid rgba(0,0,0,0.12)' }}
                            />
                          </div>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 'auto' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                              <Button 
                                component='label' 
                                variant='contained' 
                                htmlFor='general-settings-upload-image'
                                startIcon={<i className='tabler-upload' />}
                              >
                                {t('settings.general.basic.actions.uploadNewPhoto')}
                                <input
                                  hidden
                                  type='file'
                                  accept='image/png, image/jpeg, image/jpg, image/gif'
                                  onChange={handleFileInputChange}
                                  id='general-settings-upload-image'
                                />
                              </Button>
                              <Button 
                                variant='outlined' 
                                color='secondary' 
                                onClick={handleFileInputReset}
                                startIcon={<i className='tabler-refresh' />}
                              >
                                {t('settings.general.basic.actions.resetPhoto')}
                              </Button>
                            </Box>
                            <Typography variant='body2' color='text.secondary'>
                              {t('settings.general.basic.logo.help')}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Site Details */}
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.siteName.label')}
                            value={basicData.siteName}
                            placeholder={t('settings.general.basic.fields.siteName.placeholder')}
                            onChange={e => handleBasicChange('siteName', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.siteDescription.label')}
                            value={basicData.siteDescription}
                            placeholder={t('settings.general.basic.fields.siteDescription.placeholder')}
                            multiline
                            rows={3}
                            onChange={e => handleBasicChange('siteDescription', e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Localization Section */}
                  <Card variant='outlined' sx={{ mb: 6 }}>
                    <CardContent>
                      <Typography variant='h6' sx={{ mb: 4 }}>
                        {t('settings.general.basic.sections.localization')}
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <CustomTextField
                            select
                            fullWidth
                            label={t('settings.general.basic.fields.defaultLanguage.label')}
                            value={basicData.defaultLanguage}
                            onChange={e => handleBasicChange('defaultLanguage', e.target.value)}
                          >
                            <MenuItem value='en'>{t('settings.web.settingsTab.languageOptions.en')}</MenuItem>
                            <MenuItem value='zh-hans'>{t('settings.web.settingsTab.languageOptions.zhHans')}</MenuItem>
                            <MenuItem value='zh-hant'>{t('settings.web.settingsTab.languageOptions.zhHant')}</MenuItem>
                          </CustomTextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <CustomTextField
                            select
                            fullWidth
                            label={t('settings.general.basic.fields.defaultCurrency.label')}
                            value={basicData.defaultCurrency}
                            onChange={e => handleBasicChange('defaultCurrency', e.target.value)}
                          >
                            <MenuItem value='NZD'>{t('settings.general.basic.fields.defaultCurrency.options.nzd')}</MenuItem>
                            <MenuItem value='USD'>{t('settings.general.basic.fields.defaultCurrency.options.usd')}</MenuItem>
                            <MenuItem value='CNY'>{t('settings.general.basic.fields.defaultCurrency.options.cny')}</MenuItem>
                          </CustomTextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <CustomTextField
                            select
                            fullWidth
                            label={t('settings.general.basic.fields.timezone.label')}
                            value={basicData.defaultTimezone}
                            onChange={e => handleBasicChange('defaultTimezone', e.target.value)}
                            slotProps={{
                              select: { MenuProps: { PaperProps: { style: { maxHeight: 250 } } } }
                            }}
                          >
                            <MenuItem value='Pacific/Auckland'>{t('settings.general.basic.fields.timezone.options.pacificAuckland')}</MenuItem>
                            <MenuItem value='UTC'>{t('settings.general.basic.fields.timezone.options.utc')}</MenuItem>
                            <MenuItem value='Asia/Shanghai'>{t('settings.general.basic.fields.timezone.options.asiaShanghai')}</MenuItem>
                          </CustomTextField>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Contact Information Section */}
                  <Card variant='outlined' sx={{ mb: 6 }}>
                    <CardContent>
                      <Typography variant='h6' sx={{ mb: 4 }}>
                        {t('settings.general.basic.sections.contactInformation')}
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.contactEmail.label')}
                            type='email'
                            value={basicData.contactEmail}
                            placeholder={t('settings.general.basic.fields.contactEmail.placeholder')}
                            onChange={e => handleBasicChange('contactEmail', e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: <i className='tabler-mail' />
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.contactPhone.label')}
                            value={basicData.contactPhone}
                            placeholder={t('settings.general.basic.fields.contactPhone.placeholder')}
                            onChange={e => handleBasicChange('contactPhone', e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: <i className='tabler-phone' />
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.footerContact.label')}
                            value={basicData.footerContact}
                            placeholder={t('settings.general.basic.fields.footerContact.placeholder')}
                            onChange={e => handleBasicChange('footerContact', e.target.value)}
                            multiline
                            rows={3}
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <Box component='span' sx={{ mr: 1.5, display: 'flex', alignItems: 'flex-start', pt: 1.25 }}>
                                    <i className='tabler-address-book' />
                                  </Box>
                                )
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Storefront display Section */}
                  <Card variant='outlined' sx={{ mb: 6 }}>
                    <CardContent>
                      <Typography variant='h6' sx={{ mb: 4 }}>
                        {t('settings.general.basic.sections.storefrontDisplay')}
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.topBarAnnouncement.label')}
                            value={basicData.topBarAnnouncement}
                            placeholder={t('settings.general.basic.fields.topBarAnnouncement.placeholder')}
                            onChange={e => handleBasicChange('topBarAnnouncement', e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: <i className='tabler-message' />
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.footerCopyright.label')}
                            value={basicData.footerCopyright}
                            placeholder={t('settings.general.basic.fields.footerCopyright.placeholder')}
                            onChange={e => handleBasicChange('footerCopyright', e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: <i className='tabler-copyright' />
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.siteAnnouncement.label')}
                            value={basicData.siteAnnouncement}
                            placeholder={t('settings.general.basic.fields.siteAnnouncement.placeholder')}
                            onChange={e => handleBasicChange('siteAnnouncement', e.target.value)}
                            multiline
                            rows={2}
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <Box component='span' sx={{ mr: 1.5, display: 'flex', alignItems: 'flex-start', pt: 1.25 }}>
                                    <i className='tabler-info-circle' />
                                  </Box>
                                )
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Storefront theme & header options */}
                  <Card variant='outlined' sx={{ mb: 6 }}>
                    <CardContent>
                      <Typography variant='h6' sx={{ mb: 4 }}>
                        {t('settings.general.basic.sections.storefrontTheme')}
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <CustomTextField
                            select
                            fullWidth
                            label={t('settings.general.basic.fields.storefrontTheme.label')}
                            value={THEME_IDS.includes(storefrontUi.theme) ? storefrontUi.theme : THEME_IDS[0] ?? 'store'}
                            onChange={e => handleStorefrontUiChange('theme', e.target.value)}
                          >
                            {THEME_IDS.map(id => (
                              <MenuItem key={id} value={id}>
                                {themeDisplayName(id)}
                              </MenuItem>
                            ))}
                          </CustomTextField>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 2 }}>
                            {t('settings.general.basic.fields.headerOptions.label')}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={storefrontUi.header_options?.show_search !== false}
                                  onChange={e => handleHeaderOptionChange('show_search', e.target.checked)}
                                />
                              }
                              label={t('settings.general.basic.fields.headerOptions.showSearch')}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={storefrontUi.header_options?.show_cart !== false}
                                  onChange={e => handleHeaderOptionChange('show_cart', e.target.checked)}
                                />
                              }
                              label={t('settings.general.basic.fields.headerOptions.showCart')}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={storefrontUi.header_options?.show_language_switcher !== false}
                                  onChange={e => handleHeaderOptionChange('show_language_switcher', e.target.checked)}
                                />
                              }
                              label={t('settings.general.basic.fields.headerOptions.showLanguageSwitcher')}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={storefrontUi.header_options?.show_style_selector !== false}
                                  onChange={e => handleHeaderOptionChange('show_style_selector', e.target.checked)}
                                />
                              }
                              label={t('settings.general.basic.fields.headerOptions.showStyleSelector')}
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={storefrontUi.header_options?.show_login !== false}
                                  onChange={e => handleHeaderOptionChange('show_login', e.target.checked)}
                                />
                              }
                              label={t('settings.general.basic.fields.headerOptions.showLogin')}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Social Media Links Section */}
                  <Card variant='outlined' sx={{ mb: 6 }}>
                    <CardContent>
                      <Typography variant='h6' sx={{ mb: 4 }}>
                        {t('settings.general.basic.sections.socialMediaLinks')}
                      </Typography>
                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.social.facebook.label')}
                            value={basicData.facebookUrl}
                            placeholder={t('settings.general.basic.fields.social.facebook.placeholder')}
                            onChange={e => handleBasicChange('facebookUrl', e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: <i className='tabler-brand-facebook' />
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.social.twitter.label')}
                            value={basicData.twitterUrl}
                            placeholder={t('settings.general.basic.fields.social.twitter.placeholder')}
                            onChange={e => handleBasicChange('twitterUrl', e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: <i className='tabler-brand-twitter' />
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.social.instagram.label')}
                            value={basicData.instagramUrl}
                            placeholder={t('settings.general.basic.fields.social.instagram.placeholder')}
                            onChange={e => handleBasicChange('instagramUrl', e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: <i className='tabler-brand-instagram' />
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 6 }}>
                    <Button 
                      variant='contained' 
                      type='submit' 
                      disabled={saving || loading}
                      startIcon={saving ? <CircularProgress size={16} /> : <i className='tabler-check' />}
                    >
                      {saving ? t('settings.general.basic.actions.saving') : t('settings.general.basic.actions.saveChanges')}
                    </Button>
                    <Button 
                      variant='outlined' 
                      color='secondary' 
                      onClick={() => setBasicData(initialBasicData)}
                      disabled={saving || loading}
                    >
                      {t('settings.general.basic.actions.resetForm')}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </TabPanel>

            {/* Users Tab */}
            <TabPanel value='users' className='p-0'>
              <UsersListTable />
            </TabPanel>

            {/* Roles Tab */}
            <TabPanel value='roles' className='p-0'>
              <RolesListTable />
            </TabPanel>

            {/* Email Tab */}
            <TabPanel value='email' className='p-0'>
              <CardContent>
                <EmailTab />
              </CardContent>
            </TabPanel>
          </TabContext>
        </Card>
      </Grid>

      {afterSections.map(
        ext =>
          ext.component && (
            <Grid key={ext.id} size={{ xs: 12 }}>
              <ext.component />
            </Grid>
          )
      )}

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(false)} severity='success' sx={{ width: '100%' }}>
          {t('settings.general.basic.snackbar.saved')}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default GeneralSettingsPage

