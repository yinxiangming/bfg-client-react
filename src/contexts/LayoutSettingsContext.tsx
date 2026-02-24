'use client'

// React Imports
import type { ReactNode } from 'react'
import { createContext, useEffect, useMemo, useState } from 'react'

// Type Imports
import type { Layout, Skin } from '@/types/core'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useObjectCookie } from '@/hooks/useObjectCookie'

// App layout configuration type
export type AppLayoutConfig = {
  menuPosition?: Layout
  themeStyle?: Skin
}

// UpdateConfigOptions type
type UpdateConfigOptions = {
  updateCookie?: boolean
}

// AppLayoutContextProps type
type AppLayoutContextProps = {
  config: AppLayoutConfig
  updateConfig: (config: Partial<AppLayoutConfig>, options?: UpdateConfigOptions) => void
  isConfigChanged: boolean
  resetConfig: () => void
}

type Props = {
  children: ReactNode
  configCookie: AppLayoutConfig | null
}

// Initial App Layout Context
export const AppLayoutContext = createContext<AppLayoutContextProps | null>(null)

// AppLayout Provider
export const AppLayoutProvider = (props: Props) => {
  // Initial Config
  const initialConfig: AppLayoutConfig = {
    menuPosition: themeConfig.layout,
    themeStyle: themeConfig.skin
  }

  const updatedInitialConfig = {
    ...initialConfig,
    ...(props.configCookie || {})
  }

  // Cookies
  const [configCookie, updateConfigCookie] = useObjectCookie<AppLayoutConfig>(
    themeConfig.settingsCookieName,
    JSON.stringify(props.configCookie) !== '{}' && props.configCookie ? props.configCookie : updatedInitialConfig
  )

  // State
  const [_configState, _updateConfigState] = useState<AppLayoutConfig>(
    JSON.stringify(configCookie) !== '{}' && configCookie ? configCookie : updatedInitialConfig
  )

  const updateConfig = (config: Partial<AppLayoutConfig>, options?: UpdateConfigOptions) => {
    const { updateCookie = true } = options || {}

    _updateConfigState(prev => {
      const newConfig = { ...prev, ...config }

      // Update cookie if needed
      if (updateCookie) updateConfigCookie(newConfig)

      return newConfig
    })
  }

  const resetConfig = () => {
    updateConfig(initialConfig)
  }

  // Sync from cookie on client to avoid hydration mismatch when cookie differs
  useEffect(() => {
    if (typeof document === 'undefined') return

    const cookies = document.cookie.split(';').map(entry => entry.trim())
    const target = cookies.find(entry => entry.startsWith(`${themeConfig.settingsCookieName}=`))

    if (target) {
      const value = target.slice(themeConfig.settingsCookieName.length + 1)
      try {
        const parsed = JSON.parse(decodeURIComponent(value)) as AppLayoutConfig
        if (parsed && typeof parsed === 'object') {
          // Update state without writing cookie to avoid extra writes
          _updateConfigState(prev => ({ ...prev, ...parsed }))
        }
      } catch {
        // swallow parse errors
      }
    }
  }, [])

  const isConfigChanged = useMemo(
    () => JSON.stringify(initialConfig) !== JSON.stringify(_configState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [_configState]
  )

  return (
    <AppLayoutContext.Provider
      value={{
        config: _configState,
        updateConfig,
        isConfigChanged,
        resetConfig
      }}
    >
      {props.children}
    </AppLayoutContext.Provider>
  )
}
