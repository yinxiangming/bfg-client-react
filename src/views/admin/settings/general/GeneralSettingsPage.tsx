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
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Popover from '@mui/material/Popover'
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
import APIKeysTab from './APIKeysTab'
import VersionsTab from './VersionsTab'
import {
  getWorkspaceSettings,
  updateGeneralSettings,
  updateStorefrontUiSettings,
  updateShopSettings,
  fetchWorkspaceRecord,
  patchWorkspaceRecord,
  type GeneralSettingsPayload,
  type StorefrontUiSettingsPayload,
  type StorefrontHeaderOptionsPayload,
  type ShopSettingsPayload
} from '@/services/settings'
import { getCurrencies, type Currency } from '@/services/finance'
import { clearStorefrontConfigCache } from '@/utils/storefrontConfig'
import { THEME_REGISTRY } from '@/components/storefront/themes/registry.generated'
import { bfgApi } from '@/utils/api'
import { usePageSlots } from '@/extensions/hooks/usePageSections'

const THEME_IDS = Object.keys(THEME_REGISTRY).sort()
function themeDisplayName(themeId: string): string {
  return themeId.charAt(0).toUpperCase() + themeId.slice(1)
}

import { DEFAULT_AVATAR_URL } from '@/utils/media'

const DEFAULT_AVATAR = DEFAULT_AVATAR_URL

type BasicData = {
  siteName: string
  siteDescription: string
  workspaceNote: string
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

type ShopData = {
  review_moderation_required: boolean
  sku_prefix: string
  barcode_prefix: string
}
const initialShopData: ShopData = {
  review_moderation_required: false,
  sku_prefix: 'SKU-',
  barcode_prefix: 'P-'
}

// Vars
const initialBasicData: BasicData = {
  siteName: '',
  siteDescription: '',
  workspaceNote: '',
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

type FieldHelperTipProps = {
  helperText: string
  ariaLabel: string
}

/** Helper text shown in a popover when the info icon is clicked (default: hidden). */
function FieldHelperTip({ helperText, ariaLabel }: FieldHelperTipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)
  return (
    <>
      <IconButton
        size='small'
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          setAnchorEl(e.currentTarget)
        }}
        aria-label={ariaLabel}
        aria-expanded={open}
        sx={{ p: 0.25, ml: 0.25, verticalAlign: 'middle' }}
      >
        <i className='tabler-info-circle' style={{ fontSize: '1.1rem' }} />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { maxWidth: 360, p: 2 } } }}
      >
        <Typography variant='body2' color='text.secondary'>
          {helperText}
        </Typography>
      </Popover>
    </>
  )
}

const GeneralSettingsPage = () => {
  const t = useTranslations('admin')
  const { beforeSlots, afterSlots } = usePageSlots('admin/settings/general')
  // States
  const [activeTab, setActiveTab] = useState('workspace')
  const [basicData, setBasicData] = useState<BasicData>(initialBasicData)
  const [fileInput, setFileInput] = useState<string>('')
  const [imgSrc, setImgSrc] = useState<string>(DEFAULT_AVATAR)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [settingsId, setSettingsId] = useState<number | null>(null)
  const [storefrontUi, setStorefrontUi] = useState<StorefrontUiData>(initialStorefrontUi)
  const [shopData, setShopData] = useState<ShopData>(initialShopData)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [workspaceOrgName, setWorkspaceOrgName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [adminIdentityEditing, setAdminIdentityEditing] = useState(false)
  const [draftOrgName, setDraftOrgName] = useState('')
  const [draftSlug, setDraftSlug] = useState('')
  const [draftNote, setDraftNote] = useState('')
  const [savingAdminIdentity, setSavingAdminIdentity] = useState(false)

  const getEffectiveAdminIdentity = () =>
    adminIdentityEditing
      ? { org: draftOrgName.trim(), slug: draftSlug.trim(), note: draftNote }
      : { org: workspaceOrgName.trim(), slug: workspaceSlug.trim(), note: basicData.workspaceNote }

  const buildGeneralPayload = (workspaceNote: string): GeneralSettingsPayload => ({
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
    workspace_note: workspaceNote,
    logo: fileInput || undefined
  })

  const startAdminIdentityEdit = () => {
    setDraftOrgName(workspaceOrgName)
    setDraftSlug(workspaceSlug)
    setDraftNote(basicData.workspaceNote)
    setAdminIdentityEditing(true)
  }

  const cancelAdminIdentityEdit = () => {
    setAdminIdentityEditing(false)
  }

  const saveAdminIdentity = async () => {
    let currentSettingsId = settingsId
    if (!currentSettingsId) {
      try {
        const settings = await getWorkspaceSettings()
        if (!settings?.id) {
          throw new Error('Settings object does not have an id field.')
        }
        currentSettingsId = settings.id
        setSettingsId(currentSettingsId)
      } catch (err: any) {
        setError(t('settings.general.basic.errors.loadFailedWithRefresh', { error: err.message }))
        return
      }
    }
    if (!currentSettingsId) {
      setError(t('settings.general.basic.errors.settingsIdMissing'))
      return
    }

    const org = draftOrgName.trim()
    const slug = draftSlug.trim()
    const note = draftNote

    try {
      setSavingAdminIdentity(true)
      setError(null)

      await updateGeneralSettings(currentSettingsId, buildGeneralPayload(note))

      if (workspaceId != null) {
        await patchWorkspaceRecord(workspaceId, { name: org, slug })
      }

      setWorkspaceOrgName(org)
      setWorkspaceSlug(slug)
      setBasicData(prev => ({ ...prev, workspaceNote: note }))
      setAdminIdentityEditing(false)
      clearStorefrontConfigCache()
      setSuccess(true)
    } catch (err: any) {
      console.error('[GeneralSettings] Admin identity save error:', err)
      setError(t('settings.general.basic.errors.saveFailed', { error: err.message }))
    } finally {
      setSavingAdminIdentity(false)
    }
  }

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

  const clearLogoFileInputs = () => {
    for (const id of ['general-settings-upload-image', 'general-settings-upload-image-storefront'] as const) {
      const el = document.getElementById(id) as HTMLInputElement | null
      if (el) el.value = ''
    }
  }

  const handleFileInputReset = () => {
    setFileInput('')
    setImgSrc(DEFAULT_AVATAR)
    clearLogoFileInputs()
  }

  // Load initial data
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        console.log('[GeneralSettings] Loading settings...')
        const [settings, currenciesData, workspace] = await Promise.all([
          getWorkspaceSettings(),
          getCurrencies(),
          fetchWorkspaceRecord()
        ])
        if (workspace) {
          setWorkspaceId(workspace.id)
          setWorkspaceOrgName(workspace.name || '')
          setWorkspaceSlug(workspace.slug || '')
        } else if (settings.workspace_id != null) {
          setWorkspaceId(settings.workspace_id)
        }
        const activeCurrencies = currenciesData.filter(c => c.is_active)
        setCurrencies(activeCurrencies)
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

        const shop = (settings.custom_settings as any)?.shop || {}
        setShopData({
          review_moderation_required: shop.review_moderation_required ?? initialShopData.review_moderation_required,
          sku_prefix: shop.product_identifiers?.sku_prefix ?? initialShopData.sku_prefix,
          barcode_prefix: shop.product_identifiers?.barcode_prefix ?? initialShopData.barcode_prefix
        })
        const general = (settings.custom_settings as any)?.general || {}
        if (general || (settings as any).site_name != null || (settings as any).site_description != null) {
          setBasicData({
            siteName: general.site_name || (settings as any).site_name || initialBasicData.siteName,
            siteDescription: general.site_description || (settings as any).site_description || initialBasicData.siteDescription,
            defaultLanguage: general.default_language || (settings as any).default_language || initialBasicData.defaultLanguage,
            defaultCurrency: (() => {
              const saved = general.default_currency || (settings as any).default_currency || initialBasicData.defaultCurrency
              const found = activeCurrencies.some(c => c.code === saved)
              return found ? saved : (activeCurrencies[0]?.code ?? saved)
            })(),
            defaultTimezone: general.default_timezone || (settings as any).default_timezone || initialBasicData.defaultTimezone,
            contactEmail: general.contact_email || (settings as any).contact_email || initialBasicData.contactEmail,
            contactPhone: general.contact_phone || (settings as any).contact_phone || initialBasicData.contactPhone,
            facebookUrl: general.facebook_url || (settings as any).facebook_url || initialBasicData.facebookUrl,
            twitterUrl: general.twitter_url || (settings as any).twitter_url || initialBasicData.twitterUrl,
            instagramUrl: general.instagram_url || (settings as any).instagram_url || initialBasicData.instagramUrl,
            topBarAnnouncement: general.top_bar_announcement || initialBasicData.topBarAnnouncement,
            footerCopyright: general.footer_copyright || initialBasicData.footerCopyright,
            siteAnnouncement: general.site_announcement || initialBasicData.siteAnnouncement,
            footerContact: general.footer_contact || initialBasicData.footerContact,
            workspaceNote: general.workspace_note || initialBasicData.workspaceNote
          })
          
          const logoUrl = general.logo || (settings as any).logo
          if (logoUrl) {
            setImgSrc(logoUrl)
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

  // Sync defaultCurrency to first system currency when current value is not in list
  useEffect(() => {
    if (currencies.length === 0) return
    const inList = currencies.some(c => c.code === basicData.defaultCurrency)
    if (!inList && currencies[0]) {
      handleBasicChange('defaultCurrency', currencies[0].code)
    }
  }, [currencies])

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

      const { org, slug, note } = getEffectiveAdminIdentity()

      const payload = buildGeneralPayload(note)

      console.log('[GeneralSettings] Sending payload:', payload)
      console.log('[GeneralSettings] API URL will be:', `${bfgApi.settings()}${currentSettingsId}/`)

      await updateGeneralSettings(currentSettingsId, payload)

      if (workspaceId != null) {
        await patchWorkspaceRecord(workspaceId, {
          name: org,
          slug
        })
      }

      setWorkspaceOrgName(org)
      setWorkspaceSlug(slug)
      setBasicData(prev => ({ ...prev, workspaceNote: note }))
      if (adminIdentityEditing) {
        setAdminIdentityEditing(false)
      }

      const storefrontPayload: StorefrontUiSettingsPayload = {
        theme: storefrontUi.theme || undefined,
        header_options: storefrontUi.header_options
      }
      await updateStorefrontUiSettings(currentSettingsId, storefrontPayload)

      const shopPayload: ShopSettingsPayload = {
        review_moderation_required: shopData.review_moderation_required,
        product_identifiers: {
          sku_prefix: shopData.sku_prefix,
          barcode_prefix: shopData.barcode_prefix
        }
      }
      await updateShopSettings(currentSettingsId, shopPayload)

      console.log('[GeneralSettings] Save successful')
      clearStorefrontConfigCache()
      setSuccess(true)

      // Update fileInput to empty after successful save
      if (fileInput) {
        setFileInput('')
        clearLogoFileInputs()
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

      {beforeSlots.map(
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
                <Tab label={t('settings.general.page.tabs.workspace')} icon={<i className='tabler-building' />} iconPosition='start' value='workspace' />
                <Tab label={t('settings.general.page.tabs.storefront')} icon={<i className='tabler-layout-dashboard' />} iconPosition='start' value='storefront' />
                <Tab label={t('settings.general.page.tabs.users')} icon={<i className='tabler-users' />} iconPosition='start' value='users' />
                <Tab label={t('settings.general.page.tabs.roles')} icon={<i className='tabler-shield' />} iconPosition='start' value='roles' />
                <Tab label={t('settings.general.page.tabs.email')} icon={<i className='tabler-mail' />} iconPosition='start' value='email' />
                <Tab label={t('settings.general.page.tabs.apiKeys')} icon={<i className='tabler-key' />} iconPosition='start' value='api-keys' />
                <Tab label={t('settings.general.page.tabs.versions')} icon={<i className='tabler-tag' />} iconPosition='start' value='versions' />
              </CustomTabList>
            </CardContent>

            {/* Workspace: tenant identity, defaults, shop toggles */}
            <TabPanel value='workspace' className='p-0'>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <Card variant='outlined' sx={{ mb: 6 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        {!adminIdentityEditing && (
                          <Tooltip title={t('common.actions.edit')}>
                            <span>
                              <IconButton
                                size='small'
                                onClick={startAdminIdentityEdit}
                                aria-label={t('common.actions.edit')}
                              >
                                <i className='tabler-edit' />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>

                      {!adminIdentityEditing ? (
                        <Grid container spacing={4}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography variant='caption' color='text.secondary' component='span'>
                                {t('settings.general.basic.fields.workspaceOrgName.label')}
                              </Typography>
                              <FieldHelperTip
                                helperText={t('settings.general.basic.fields.workspaceOrgName.helper')}
                                ariaLabel={t('settings.general.basic.helperTipAria')}
                              />
                            </Box>
                            <Typography variant='body1' sx={{ wordBreak: 'break-word' }}>
                              {workspaceOrgName.trim() || '—'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography variant='caption' color='text.secondary' component='span'>
                                {t('settings.general.basic.fields.workspaceSlug.label')}
                              </Typography>
                              <FieldHelperTip
                                helperText={t('settings.general.basic.fields.workspaceSlug.helper')}
                                ariaLabel={t('settings.general.basic.helperTipAria')}
                              />
                            </Box>
                            <Typography variant='body1' sx={{ wordBreak: 'break-all' }}>
                              {workspaceSlug.trim() || '—'}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography variant='caption' color='text.secondary' component='span'>
                                {t('settings.general.basic.fields.workspaceNote.label')}
                              </Typography>
                              <FieldHelperTip
                                helperText={t('settings.general.basic.fields.workspaceNote.helper')}
                                ariaLabel={t('settings.general.basic.helperTipAria')}
                              />
                            </Box>
                            <Typography
                              variant='body1'
                              sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            >
                              {basicData.workspaceNote.trim() ? basicData.workspaceNote : '—'}
                            </Typography>
                          </Grid>
                        </Grid>
                      ) : (
                        <>
                          <Grid container spacing={4}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomTextField
                                fullWidth
                                label={
                                  <Box
                                    component='span'
                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap' }}
                                  >
                                    <span>{t('settings.general.basic.fields.workspaceOrgName.label')}</span>
                                    <FieldHelperTip
                                      helperText={t('settings.general.basic.fields.workspaceOrgName.helper')}
                                      ariaLabel={t('settings.general.basic.helperTipAria')}
                                    />
                                  </Box>
                                }
                                value={draftOrgName}
                                onChange={e => setDraftOrgName(e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <CustomTextField
                                fullWidth
                                label={
                                  <Box
                                    component='span'
                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap' }}
                                  >
                                    <span>{t('settings.general.basic.fields.workspaceSlug.label')}</span>
                                    <FieldHelperTip
                                      helperText={t('settings.general.basic.fields.workspaceSlug.helper')}
                                      ariaLabel={t('settings.general.basic.helperTipAria')}
                                    />
                                  </Box>
                                }
                                value={draftSlug}
                                onChange={e => setDraftSlug(e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <CustomTextField
                                fullWidth
                                label={
                                  <Box
                                    component='span'
                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap' }}
                                  >
                                    <span>{t('settings.general.basic.fields.workspaceNote.label')}</span>
                                    <FieldHelperTip
                                      helperText={t('settings.general.basic.fields.workspaceNote.helper')}
                                      ariaLabel={t('settings.general.basic.helperTipAria')}
                                    />
                                  </Box>
                                }
                                value={draftNote}
                                onChange={e => setDraftNote(e.target.value)}
                                multiline
                                rows={2}
                              />
                            </Grid>
                          </Grid>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                            <Button
                              type='button'
                              variant='contained'
                              onClick={saveAdminIdentity}
                              disabled={savingAdminIdentity}
                              startIcon={
                                savingAdminIdentity ? (
                                  <CircularProgress size={16} color='inherit' />
                                ) : (
                                  <i className='tabler-check' />
                                )
                              }
                            >
                              {t('common.schemaTable.confirm')}
                            </Button>
                            <Button
                              type='button'
                              variant='outlined'
                              color='secondary'
                              onClick={cancelAdminIdentityEdit}
                              disabled={savingAdminIdentity}
                            >
                              {t('common.schemaForm.cancel')}
                            </Button>
                          </Box>
                        </>
                      )}

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
                            value={currencies.some(c => c.code === basicData.defaultCurrency) ? basicData.defaultCurrency : (currencies[0]?.code ?? '')}
                            onChange={e => handleBasicChange('defaultCurrency', e.target.value)}
                          >
                            {currencies.map(c => (
                              <MenuItem key={c.id} value={c.code}>
                                {c.code} ({c.symbol})
                              </MenuItem>
                            ))}
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

                  {/* Shop / Reviews Section */}
                  <Card variant='outlined' sx={{ mb: 6 }}>
                    <CardContent>
                      <Typography variant='h6' sx={{ mb: 2 }}>
                        {t('settings.general.basic.sections.shop')}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={shopData.review_moderation_required}
                            onChange={e => setShopData(prev => ({ ...prev, review_moderation_required: e.target.checked }))}
                          />
                        }
                        label={t('settings.general.basic.fields.shop.reviewModerationRequired')}
                      />
                      <Grid container spacing={4} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {t('settings.general.basic.fields.shop.identifierManageHint')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 6 }}>
                    <Button 
                      variant='contained' 
                      type='submit' 
                      disabled={saving || loading || savingAdminIdentity}
                      startIcon={saving ? <CircularProgress size={16} /> : <i className='tabler-check' />}
                    >
                      {saving ? t('settings.general.basic.actions.saving') : t('settings.general.basic.actions.saveChanges')}
                    </Button>
                    <Button 
                      variant='outlined' 
                      color='secondary' 
                      onClick={() => setBasicData(initialBasicData)}
                      disabled={saving || loading || savingAdminIdentity}
                    >
                      {t('settings.general.basic.actions.resetForm')}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </TabPanel>

            {/* Storefront: customer-visible branding, contact, theme, social */}
            <TabPanel value='storefront' className='p-0'>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <Card variant='outlined' sx={{ mb: 6 }}>
                    <CardContent>
                      <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                        {t('settings.general.basic.subsections.storefrontBranding')}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                        {t('settings.general.basic.sections.storefrontBrandingIntro')}
                      </Typography>

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
                                htmlFor='general-settings-upload-image-storefront'
                                startIcon={<i className='tabler-upload' />}
                              >
                                {t('settings.general.basic.actions.uploadNewPhoto')}
                                <input
                                  hidden
                                  type='file'
                                  accept='image/png, image/jpeg, image/jpg, image/gif'
                                  onChange={handleFileInputChange}
                                  id='general-settings-upload-image-storefront'
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

                      <Grid container spacing={4}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <CustomTextField
                            fullWidth
                            label={t('settings.general.basic.fields.siteName.label')}
                            value={basicData.siteName}
                            placeholder={t('settings.general.basic.fields.siteName.placeholder')}
                            onChange={e => handleBasicChange('siteName', e.target.value)}
                            helperText={t('settings.general.basic.fields.siteName.helper')}
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
                            helperText={t('settings.general.basic.fields.siteDescription.helper')}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

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
                      disabled={saving || loading || savingAdminIdentity}
                      startIcon={saving ? <CircularProgress size={16} /> : <i className='tabler-check' />}
                    >
                      {saving ? t('settings.general.basic.actions.saving') : t('settings.general.basic.actions.saveChanges')}
                    </Button>
                    <Button 
                      variant='outlined' 
                      color='secondary' 
                      onClick={() => setBasicData(initialBasicData)}
                      disabled={saving || loading || savingAdminIdentity}
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

            {/* API Keys Tab */}
            <TabPanel value='api-keys' className='p-0'>
              <APIKeysTab />
            </TabPanel>

            <TabPanel value='versions' className='p-0'>
              <VersionsTab />
            </TabPanel>
          </TabContext>
        </Card>
      </Grid>

      {afterSlots.map(
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

