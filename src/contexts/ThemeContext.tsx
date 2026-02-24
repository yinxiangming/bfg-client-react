'use client'

// React Imports
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Type Imports
import type { Mode, SystemMode } from '@/types/core'

type ThemeContextType = {
  mode: Mode
  systemMode: SystemMode
  setMode: (mode: Mode) => void
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

type ThemeProviderProps = {
  children: React.ReactNode
  initialMode?: Mode
}

export const ThemeContextProvider = ({ children, initialMode }: ThemeProviderProps) => {
  // Prefer stored mode; fallback to initial or system
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

  // Initialize body data-mode on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const effectiveMode = mode === 'system' ? systemMode : mode
    document.body.setAttribute('data-mode', effectiveMode)
    document.documentElement.setAttribute('data-mode', effectiveMode)
  }, [])

  // Listen to system theme changes
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

  // Update body data-mode attribute when mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const effectiveMode = mode === 'system' ? systemMode : mode
    document.body.setAttribute('data-mode', effectiveMode)
    document.documentElement.setAttribute('data-mode', effectiveMode)
  }, [mode, systemMode])

  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newMode)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const effectiveMode = mode === 'system' ? systemMode : mode

  return (
    <ThemeContext.Provider value={{ mode, systemMode: effectiveMode, setMode }}>
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
