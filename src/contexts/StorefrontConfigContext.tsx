'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  getStorefrontConfig,
  type StorefrontConfig,
} from '@/utils/storefrontConfig'

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
  default_currency: 'NZD',
  top_bar_announcement: '',
  footer_copyright: '',
  site_announcement: '',
  footer_contact: '',
  header_menus: [],
  footer_menus: [],
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
      return
    }
    fetchConfig()
  }, [initialConfig, fetchConfig])

  const value: StorefrontConfigContextType = {
    config,
    loading,
    error,
    refetch: fetchConfig,
  }

  return (
    <StorefrontConfigContext.Provider value={value}>
      {children}
    </StorefrontConfigContext.Provider>
  )
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
