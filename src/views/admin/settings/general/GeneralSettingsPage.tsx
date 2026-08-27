'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ChangeEvent, SyntheticEvent, FormEvent, ReactNode } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import TabPanel from '@mui/lab/TabPanel'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

// Component Imports
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CustomTextField from '@/components/ui/TextField'
import {
  SettingsSection,
  ReadOnlyField,
  SettingsActionBar
} from '@/components/admin/settings/SettingsSection'
import { SettingsCard, flushPanelSx } from '@/components/admin/settings/SettingsTabsPage'
import UsersListTable from './UsersListTable'
import RolesListTable from './RolesListTable'
import EmailTab from './EmailTab'
import APIKeysTab from './APIKeysTab'
import VersionsTab from './VersionsTab'
import PluginsTab from './PluginsTab'
import {
  getWorkspaceSettings,
  updateGeneralSettings,
  updateStorefrontUiSettings,
  updateShopSettings,
  updateAnalyticsSettings,
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

type ColorMode = 'light' | 'dark'

type StorefrontUiData = {
  theme: string
  header_options: StorefrontHeaderOptionsPayload
  allowed_color_modes: ColorMode[]
  default_color_mode: 'light' | 'dark' | 'system'
}

const ALL_COLOR_MODES: ColorMode[] = ['light', 'dark']

const initialStorefrontUi: StorefrontUiData = {
  theme: THEME_IDS[0] ?? 'store',
  header_options: { ...defaultHeaderOptions },
  allowed_color_modes: [...ALL_COLOR_MODES],
  default_color_mode: 'system'
}

type AnalyticsData = {
  google_analytics_id: string
}

const initialAnalyticsData: AnalyticsData = {
  google_analytics_id: ''
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

/** Rail entries. Labels resolve per render; ids and icons are static. */
const TAB_RAIL_ITEMS = [
  { value: 'workspace', icon: 'tabler-building', labelKey: 'settings.general.page.tabs.workspace' },
  { value: 'storefront', icon: 'tabler-layout-dashboard', labelKey: 'settings.general.page.tabs.storefront' },
  { value: 'users', icon: 'tabler-users', labelKey: 'settings.general.page.tabs.users' },
  { value: 'roles', icon: 'tabler-shield', labelKey: 'settings.general.page.tabs.roles' },
  { value: 'email', icon: 'tabler-mail', labelKey: 'settings.general.page.tabs.email' },
  { value: 'api-keys', icon: 'tabler-key', labelKey: 'settings.general.page.tabs.apiKeys' },
  { value: 'plugins', icon: 'tabler-plug', labelKey: 'settings.general.page.tabs.plugins' },
  { value: 'versions', icon: 'tabler-tag', labelKey: 'settings.general.page.tabs.versions' }
]

/** Every branding preview occupies the same square, whatever its art measures. */
const ASSET_PREVIEW_SIZE = 120

/**
 * One branding asset: a fixed-width preview, then its controls and help text.
 *
 * The gutter is the same width for every row — the favicon's art is half the size
 * of the logo's, but its tile is not. Sizing each preview to its own content is
 * what left three sets of buttons starting at three different x positions, which
 * reads as three unrelated widgets rather than one branding block. Declared at
 * module scope rather than inside the page so a re-render does not remount the
 * rows and wipe the file inputs they contain.
 */
const AssetRow = ({ preview, children }: { preview: ReactNode; children: ReactNode }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: { xs: 'column', sm: 'row' },
      alignItems: 'flex-start',
      gap: 4,
      mb: 5
    }}
  >
    <Box sx={{ width: ASSET_PREVIEW_SIZE, flexShrink: 0 }}>{preview}</Box>
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</Box>
  </Box>
)

/** The square a preview sits in: same size everywhere, art centred and never cropped. */
const assetTileSx = (background?: string) => ({
  height: ASSET_PREVIEW_SIZE,
  width: ASSET_PREVIEW_SIZE,
  borderRadius: 1,
  border: '1px solid var(--mui-palette-divider)',
  backgroundColor: background,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
})

const GeneralSettingsPage = () => {
  const t = useTranslations('admin')
  const { beforeSlots, afterSlots } = usePageSlots('admin/settings/general')
  // States
  const [activeTab, setActiveTab] = useState('workspace')
  const TAB_RAIL = TAB_RAIL_ITEMS.map(item => ({
    value: item.value,
    icon: item.icon,
    label: t(item.labelKey)
  }))
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(initialAnalyticsData)
  /**
   * The logo value as it should be persisted: a data URL, or '' for "no logo".
   * Kept apart from `imgSrc`, which falls back to a placeholder image that must
   * never be saved, and from `fileInput`, which only holds a *freshly picked*
   * file and is cleared after every save.
   */
  const [logoValue, setLogoValue] = useState<string>('')
  /**
   * The dark-surface logo, same value semantics as `logoValue` — doubles as the
   * preview src. Empty means "no separate dark logo", and the storefront falls
   * back to the light one, which is what every workspace had before this field.
   */
  const [logoDarkValue, setLogoDarkValue] = useState<string>('')
  /** Favicon, same value semantics as `logoValue` — doubles as the preview src. */
  const [faviconSrc, setFaviconSrc] = useState<string>('')
  const [showNameWithLogo, setShowNameWithLogo] = useState(false)
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
    // Always an explicit string. `undefined` would be dropped by JSON.stringify,
    // and since the PATCH replaces custom_settings.general wholesale, a missing
    // key erases the stored logo — which is how saving this form for any other
    // reason (a GA4 id, a footer tweak) used to wipe the workspace's logo.
    logo: logoValue,
    logo_dark: logoDarkValue,
    favicon: faviconSrc,
    show_site_name_with_logo: showNameWithLogo
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
        setLogoValue(reader.result as string)
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
    setLogoValue('')
    setImgSrc(DEFAULT_AVATAR)
    clearLogoFileInputs()
  }

  const handleLogoDarkInputChange = (event: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = event.target as HTMLInputElement

    if (files && files.length !== 0) {
      reader.onload = () => {
        setLogoDarkValue(reader.result as string)
      }
      reader.readAsDataURL(files[0])
    }
  }

  const handleLogoDarkReset = () => {
    setLogoDarkValue('')
    const el = document.getElementById('general-settings-upload-logo-dark') as HTMLInputElement | null
    if (el) el.value = ''
  }

  const handleFaviconInputChange = (event: ChangeEvent) => {
    const reader = new FileReader()
    const { files } = event.target as HTMLInputElement

    if (files && files.length !== 0) {
      reader.onload = () => {
        setFaviconSrc(reader.result as string)
      }
      reader.readAsDataURL(files[0])
    }
  }

  const handleFaviconReset = () => {
    setFaviconSrc('')
    const el = document.getElementById('general-settings-upload-favicon') as HTMLInputElement | null
    if (el) el.value = ''
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
          const rawModes = Array.isArray(storefront_ui.allowed_color_modes)
            ? (storefront_ui.allowed_color_modes as unknown[]).filter(
                (m): m is ColorMode => m === 'light' || m === 'dark'
              )
            : []
          const allowedColorModes: ColorMode[] = rawModes.length > 0 ? Array.from(new Set(rawModes)) as ColorMode[] : [...ALL_COLOR_MODES]
          const rawDefault = storefront_ui.default_color_mode
          const defaultColorMode: 'light' | 'dark' | 'system' =
            rawDefault === 'light' || rawDefault === 'dark' || rawDefault === 'system'
              ? rawDefault
              : allowedColorModes.length === 1
              ? allowedColorModes[0]
              : 'system'
          setStorefrontUi({
            theme: THEME_IDS.includes(themeId) ? themeId : THEME_IDS[0] ?? 'store',
            header_options: { ...defaultHeaderOptions, ...(storefront_ui.header_options || {}) },
            allowed_color_modes: allowedColorModes,
            default_color_mode: defaultColorMode
          })
        }

        const shop = (settings.custom_settings as any)?.shop || {}
        setShopData({
          review_moderation_required: shop.review_moderation_required ?? initialShopData.review_moderation_required,
          sku_prefix: shop.product_identifiers?.sku_prefix ?? initialShopData.sku_prefix,
          barcode_prefix: shop.product_identifiers?.barcode_prefix ?? initialShopData.barcode_prefix
        })
        const analytics = (settings.custom_settings as any)?.analytics || {}
        setAnalyticsData({
          google_analytics_id: analytics.google_analytics_id ?? initialAnalyticsData.google_analytics_id
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
            setLogoValue(logoUrl)
          }
          // No model field to fall back to — the dark variant lives only here.
          if (general.logo_dark) {
            setLogoDarkValue(general.logo_dark)
          }
          const faviconUrl = general.favicon || (settings as any).favicon
          if (faviconUrl) {
            setFaviconSrc(faviconUrl)
          }
          setShowNameWithLogo(Boolean(general.show_site_name_with_logo))
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
        header_options: storefrontUi.header_options,
        allowed_color_modes: storefrontUi.allowed_color_modes,
        default_color_mode: storefrontUi.default_color_mode
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

      await updateAnalyticsSettings(currentSettingsId, {
        google_analytics_id: analyticsData.google_analytics_id.trim()
      })

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
        <AdminPageHeader
          flush
          title={t('settings.general.page.title')}
          subtitle={t('settings.general.page.subtitle')}
        />
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
        <SettingsCard activeTab={activeTab} tabs={TAB_RAIL} onTabChange={handleTabChange}>

            {/* Workspace: tenant identity, defaults, shop toggles */}
            <TabPanel value='workspace' sx={flushPanelSx}>
              <form onSubmit={handleSubmit}>
                <SettingsSection
                  flush
                  title={t('settings.general.basic.subsections.adminIdentity')}
                  description={t('settings.general.basic.sectionHints.adminIdentity')}
                  action={
                    !adminIdentityEditing && (
                      <Button
                        type='button'
                        size='small'
                        variant='outlined'
                        color='secondary'
                        onClick={startAdminIdentityEdit}
                        startIcon={<i className='tabler-edit' />}
                      >
                        {t('common.actions.edit')}
                      </Button>
                    )
                  }
                >
                  {!adminIdentityEditing ? (
                    <Grid container spacing={4}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ReadOnlyField
                          label={
                            <>
                              <Typography component='span' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                {t('settings.general.basic.fields.workspaceOrgName.label')}
                              </Typography>
                              <FieldHelperTip
                                helperText={t('settings.general.basic.fields.workspaceOrgName.helper')}
                                ariaLabel={t('settings.general.basic.helperTipAria')}
                              />
                            </>
                          }
                          value={workspaceOrgName.trim()}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ReadOnlyField
                          label={
                            <>
                              <Typography component='span' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                {t('settings.general.basic.fields.workspaceSlug.label')}
                              </Typography>
                              <FieldHelperTip
                                helperText={t('settings.general.basic.fields.workspaceSlug.helper')}
                                ariaLabel={t('settings.general.basic.helperTipAria')}
                              />
                            </>
                          }
                          value={workspaceSlug.trim()}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <ReadOnlyField
                          multiline
                          label={
                            <>
                              <Typography component='span' sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                {t('settings.general.basic.fields.workspaceNote.label')}
                              </Typography>
                              <FieldHelperTip
                                helperText={t('settings.general.basic.fields.workspaceNote.helper')}
                                ariaLabel={t('settings.general.basic.helperTipAria')}
                              />
                            </>
                          }
                          value={basicData.workspaceNote.trim()}
                        />
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
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 4 }}>
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
                </SettingsSection>

                <SettingsSection
                  title={t('settings.general.basic.sections.localization')}
                  description={t('settings.general.basic.sectionHints.localization')}
                >
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                </SettingsSection>

                <SettingsSection
                  title={t('settings.general.basic.sections.shop')}
                  description={t('settings.general.basic.sectionHints.shop')}
                >
                  <FormControlLabel
                    sx={{ ml: 0 }}
                    control={
                      <Checkbox
                        checked={shopData.review_moderation_required}
                        onChange={e => setShopData(prev => ({ ...prev, review_moderation_required: e.target.checked }))}
                      />
                    }
                    label={t('settings.general.basic.fields.shop.reviewModerationRequired')}
                  />
                  <Typography sx={{ mt: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
                    {t('settings.general.basic.fields.shop.identifierManageHint')}
                  </Typography>
                </SettingsSection>

                <SettingsActionBar>
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
                </SettingsActionBar>
              </form>
            </TabPanel>

            {/* Storefront: customer-visible branding, contact, theme, social */}
            <TabPanel value='storefront' sx={flushPanelSx}>
              <form onSubmit={handleSubmit}>
                <SettingsSection
                  flush
                  title={t('settings.general.basic.subsections.storefrontBranding')}
                  description={t('settings.general.basic.sectionHints.storefrontBranding')}
                >
                    <AssetRow
                      preview={
                        <Box sx={assetTileSx()}>
                          <img
                            src={imgSrc}
                            alt={t('settings.general.basic.logo.alt')}
                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                          />
                        </Box>
                      }
                    >
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
                    </AssetRow>

                    {/* The dark-surface variant, previewed on a dark tile because that is the
                        only background it will ever be seen against — a light-ink mark on the
                        page's own card looks broken until you put it where it belongs. */}
                    <AssetRow
                      preview={
                        <Box sx={{ ...assetTileSx('#1a1a1a'), color: 'rgba(255,255,255,0.4)' }}>
                          {logoDarkValue ? (
                            <img
                              src={logoDarkValue}
                              alt={t('settings.general.basic.logoDark.alt')}
                              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <i className='tabler-moon' style={{ fontSize: '1.75rem' }} />
                          )}
                        </Box>
                      }
                    >
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Button
                          component='label'
                          variant='contained'
                          htmlFor='general-settings-upload-logo-dark'
                          startIcon={<i className='tabler-upload' />}
                        >
                          {t('settings.general.basic.logoDark.upload')}
                          <input
                            hidden
                            type='file'
                            accept='image/png, image/jpeg, image/jpg, image/gif, image/svg+xml'
                            onChange={handleLogoDarkInputChange}
                            id='general-settings-upload-logo-dark'
                          />
                        </Button>
                        <Button
                          variant='outlined'
                          color='secondary'
                          onClick={handleLogoDarkReset}
                          startIcon={<i className='tabler-refresh' />}
                        >
                          {t('settings.general.basic.actions.resetPhoto')}
                        </Button>
                      </Box>
                      <Typography variant='body2' color='text.secondary'>
                        {t('settings.general.basic.logoDark.help')}
                      </Typography>
                    </AssetRow>

                    {/* Below both logos, not beside one of them: the setting governs the pair.
                        Indented into the same column as the buttons above so the controls of
                        this block share one left edge. */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4, mb: 5 }}>
                      <Box sx={{ width: ASSET_PREVIEW_SIZE, flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={showNameWithLogo}
                            onChange={e => setShowNameWithLogo(e.target.checked)}
                          />
                        }
                        label={t('settings.general.basic.logo.showSiteName')}
                      />
                    </Box>

                    <AssetRow
                      preview={
                        <Box
                          sx={{
                            ...assetTileSx(),
                            ...(faviconSrc ? {} : { borderStyle: 'dashed', color: 'text.disabled' })
                          }}
                        >
                          {faviconSrc ? (
                            <img
                              height={64}
                              width={64}
                              src={faviconSrc}
                              alt={t('settings.general.basic.favicon.alt')}
                              style={{ objectFit: 'contain' }}
                            />
                          ) : (
                            <i className='tabler-world' style={{ fontSize: '1.75rem' }} />
                          )}
                        </Box>
                      }
                    >
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Button
                          component='label'
                          variant='contained'
                          htmlFor='general-settings-upload-favicon'
                          startIcon={<i className='tabler-upload' />}
                        >
                          {t('settings.general.basic.favicon.upload')}
                          <input
                            hidden
                            type='file'
                            accept='image/png, image/x-icon, image/vnd.microsoft.icon, image/svg+xml'
                            onChange={handleFaviconInputChange}
                            id='general-settings-upload-favicon'
                          />
                        </Button>
                        <Button
                          variant='outlined'
                          color='secondary'
                          onClick={handleFaviconReset}
                          startIcon={<i className='tabler-refresh' />}
                        >
                          {t('settings.general.basic.actions.resetPhoto')}
                        </Button>
                      </Box>
                      <Typography variant='body2' color='text.secondary'>
                        {t('settings.general.basic.favicon.help')}
                      </Typography>
                    </AssetRow>

                    <Grid container spacing={2}>
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
                </SettingsSection>

                <SettingsSection
                  title={t('settings.general.basic.sections.contactInformation')}
                  description={t('settings.general.basic.sectionHints.contactInformation')}
                >
                    <Grid container spacing={2}>
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
                </SettingsSection>

                <SettingsSection
                  title={t('settings.general.basic.sections.storefrontDisplay')}
                  description={t('settings.general.basic.sectionHints.storefrontDisplay')}
                >
                    <Grid container spacing={2}>
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
                </SettingsSection>

                <SettingsSection
                  title={t('settings.general.basic.sections.storefrontTheme')}
                  description={t('settings.general.basic.sectionHints.storefrontTheme')}
                >
                    <Grid container spacing={2}>
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
                          Allowed color modes
                        </Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
                          Tick the modes the storefront / account / auth UIs may render in.
                          When only one is selected, the switcher is hidden and that mode is
                          forced for all visitors.
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {ALL_COLOR_MODES.map(mode => {
                            const checked = storefrontUi.allowed_color_modes.includes(mode)
                            const isOnlyOne = checked && storefrontUi.allowed_color_modes.length === 1
                            return (
                              <FormControlLabel
                                key={mode}
                                control={
                                  <Checkbox
                                    checked={checked}
                                    disabled={isOnlyOne}
                                    onChange={e => {
                                      const next = e.target.checked
                                        ? Array.from(new Set([...storefrontUi.allowed_color_modes, mode]))
                                        : storefrontUi.allowed_color_modes.filter(m => m !== mode)
                                      // Never let the admin save an empty allow-list — that
                                      // would lock the site out of any color scheme.
                                      if (next.length === 0) return
                                      handleStorefrontUiChange('allowed_color_modes', next as ColorMode[])
                                      // If the configured default falls outside the new set,
                                      // snap it back to the first allowed mode.
                                      const cur = storefrontUi.default_color_mode
                                      if (next.length === 1) {
                                        handleStorefrontUiChange('default_color_mode', next[0])
                                      } else if ((cur === 'light' || cur === 'dark') && !next.includes(cur)) {
                                        handleStorefrontUiChange('default_color_mode', next[0])
                                      }
                                    }}
                                  />
                                }
                                label={mode === 'light' ? 'Light' : 'Dark'}
                              />
                            )
                          })}
                        </Box>
                        {storefrontUi.allowed_color_modes.length > 1 && (
                          <Box sx={{ mt: 2, maxWidth: 280 }}>
                            <CustomTextField
                              select
                              fullWidth
                              label='Default color mode'
                              value={storefrontUi.default_color_mode}
                              onChange={e =>
                                handleStorefrontUiChange(
                                  'default_color_mode',
                                  e.target.value as 'light' | 'dark' | 'system'
                                )
                              }
                            >
                              <MenuItem value='system'>Follow OS preference</MenuItem>
                              {storefrontUi.allowed_color_modes.map(m => (
                                <MenuItem key={m} value={m}>
                                  {m === 'light' ? 'Light' : 'Dark'}
                                </MenuItem>
                              ))}
                            </CustomTextField>
                          </Box>
                        )}
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
                </SettingsSection>

                <SettingsSection
                  title={t('settings.general.basic.sections.analytics')}
                  description={t('settings.general.basic.sectionHints.analytics')}
                >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                          fullWidth
                          label={
                            <Box
                              component='span'
                              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap' }}
                            >
                              <span>{t('settings.general.basic.fields.analytics.googleAnalyticsId.label')}</span>
                              <FieldHelperTip
                                helperText={t('settings.general.basic.fields.analytics.googleAnalyticsId.helper')}
                                ariaLabel={t('settings.general.basic.helperTipAria')}
                              />
                            </Box>
                          }
                          value={analyticsData.google_analytics_id}
                          placeholder={t('settings.general.basic.fields.analytics.googleAnalyticsId.placeholder')}
                          onChange={e => setAnalyticsData({ google_analytics_id: e.target.value })}
                          slotProps={{
                            input: {
                              startAdornment: <i className='tabler-chart-bar' />
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                </SettingsSection>

                <SettingsSection
                  title={t('settings.general.basic.sections.socialMediaLinks')}
                  description={t('settings.general.basic.sectionHints.socialMediaLinks')}
                >
                    <Grid container spacing={2}>
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
                </SettingsSection>

                <SettingsActionBar>
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
                </SettingsActionBar>
              </form>
            </TabPanel>

            {/* Users Tab */}
            <TabPanel value='users' sx={flushPanelSx}>
              <UsersListTable />
            </TabPanel>

            {/* Roles Tab */}
            <TabPanel value='roles' sx={flushPanelSx}>
              <RolesListTable />
            </TabPanel>

            {/* Email Tab */}
            <TabPanel value='email' sx={flushPanelSx}>
              {/* No gutter wrapper: like the API Keys, Users and Roles panels,
                  EmailTab is a table that runs edge to edge and insets its own
                  copy to match. Wrapping it pushed the table in twice over. */}
              <EmailTab />
            </TabPanel>

            {/* API Keys Tab */}
            <TabPanel value='api-keys' sx={flushPanelSx}>
              <APIKeysTab />
            </TabPanel>

            <TabPanel value='plugins' sx={flushPanelSx}>
              <PluginsTab />
            </TabPanel>

            <TabPanel value='versions' sx={flushPanelSx}>
              <VersionsTab />
            </TabPanel>
        </SettingsCard>
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

