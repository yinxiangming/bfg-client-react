'use client'

// React Imports
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Type Imports
import type { Mode, SystemMode } from '@/types/core'

type ThemeContextType = {
  mode: Mode
  systemMode: SystemMode
  setMode: (mode: Mode) => void
  forceMode: (forced: SystemMode | null) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'theme-mode'

const getSystemMode = (): SystemMode => {
  if (typeof window === 'undefined') return 'light'

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const getStoredMode = (): Mode => {
  if (typeof window === 'undefined') return 'system'

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // Ignore localStorage errors
  }

  return 'system'
}

function applyMode(m: SystemMode) {
  const html = document.documentElement
  html.setAttribute('data-mode', m)
  document.body.setAttribute('data-mode', m)
  // Sync MUI data-* color scheme attributes set by InitColorSchemeScript
  if (m === 'dark') {
    html.setAttribute('data-dark', '')
    html.removeAttribute('data-light')
  } else {
    html.setAttribute('data-light', '')
    html.removeAttribute('data-dark')
  }
}

type ThemeProviderProps = {
  children: React.ReactNode
  initialMode?: Mode
}

export const ThemeContextProvider = ({ children, initialMode }: ThemeProviderProps) => {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      const stored = getStoredMode()
      return stored || initialMode || 'system'
    }
    return initialMode || 'system'
  })

  const [systemMode, setSystemMode] = useState<SystemMode>(() => {
    if (typeof window !== 'undefined') {
      return getSystemMode()
    }
    return 'light'
  })

  const [forcedMode, setForcedMode] = useState<SystemMode | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const effectiveMode = forcedMode ?? (mode === 'system' ? systemMode : mode)
    applyMode(effectiveMode)
  }, [mode, systemMode, forcedMode])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light')
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const forceMode = useCallback((forced: SystemMode | null) => {
    setForcedMode(forced)
  }, [])

  const effectiveMode = forcedMode ?? (mode === 'system' ? systemMode : mode)

  return (
    <ThemeContext.Provider value={{ mode, systemMode: effectiveMode, setMode, forceMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider')
  }
  return context
}
