'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  getAllowedColorModes,
  getStorefrontConfig,
  hasMultipleStorefrontLanguages,
  resolveStorefrontLocale,
  seedStorefrontConfigCache,
  type StorefrontConfig,
} from '@/utils/storefrontConfig'
import { useTheme } from '@/contexts/ThemeContext'

type StorefrontConfigContextType = {
  config: StorefrontConfig | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const defaultConfig: StorefrontConfig = {
  site_name: '',
  site_description: '',
  contact_email: '',
  support_email: '',
  contact_phone: '',
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  default_currency: 'USD',
  top_bar_announcement: '',
  footer_copyright: '',
  site_announcement: '',
  footer_contact: '',
  header_menus: [],
  footer_menus: [],
  default_language: 'en',
  languages: ['en'],
  allowed_color_modes: ['light', 'dark'],
  default_color_mode: 'system',
  theme: 'store',
  header_options: {
    show_search: true,
    show_cart: true,
    show_language_switcher: true,
    show_style_selector: true,
    show_login: true,
  },
}

const StorefrontConfigContext = createContext<StorefrontConfigContextType | undefined>(undefined)

type StorefrontConfigProviderProps = {
  children: React.ReactNode
  /** When set, used as initial config and fetch is skipped until refetch(). */
  initialConfig?: StorefrontConfig | null
}

export function StorefrontConfigProvider({ children, initialConfig }: StorefrontConfigProviderProps) {
  const [config, setConfig] = useState<StorefrontConfig | null>(initialConfig ?? null)
  const [loading, setLoading] = useState(!initialConfig)
  const [error, setError] = useState<Error | null>(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStorefrontConfig()
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialConfig != null) {
      setConfig(initialConfig)
      setLoading(false)
      seedStorefrontConfigCache(initialConfig)
      return
    }
    fetchConfig()
  }, [initialConfig, fetchConfig])

  useEffect(() => {
    if (!config || hasMultipleStorefrontLanguages(config) || typeof document === 'undefined') return
    const locale = resolveStorefrontLocale(config)
    const maxAge = 60 * 60 * 24 * 365
    document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)};path=/;max-age=${maxAge}`
  }, [config])

  const value: StorefrontConfigContextType = {
    config,
    loading,
    error,
    refetch: fetchConfig,
  }

  return (
    <StorefrontConfigContext.Provider value={value}>
      <ColorModeEnforcer config={config} />
      {children}
    </StorefrontConfigContext.Provider>
  )
}

/**
 * When the storefront config allows only one color mode (e.g. light), force
 * that mode on the ThemeContext — overriding any stored localStorage choice
 * or OS preference — for as long as this provider is mounted. When multiple
 * modes are allowed, release the override so the user's choice wins again.
 *
 * Mirrors the language-locale lock-in at line 84 above.
 */
function ColorModeEnforcer({ config }: { config: StorefrontConfig | null }) {
  const { forceMode } = useTheme()
  useEffect(() => {
    if (!config) return
    const allowed = getAllowedColorModes(config)
    if (allowed.length === 1) {
      forceMode(allowed[0])
    } else {
      forceMode(null)
    }
  }, [config, forceMode])
  return null
}

export function useStorefrontConfig(): StorefrontConfigContextType {
  const ctx = useContext(StorefrontConfigContext)
  if (ctx === undefined) {
    return {
      config: null,
      loading: false,
      error: null,
      refetch: async () => {},
    }
  }
  return ctx
}

/** Safe config for Header/Footer: never null, use empty strings/arrays when not loaded */
export function useStorefrontConfigSafe(): StorefrontConfig {
  const { config } = useStorefrontConfig()
  return config ?? defaultConfig
}
