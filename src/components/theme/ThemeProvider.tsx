'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import { ThemeProvider as MuiThemeProvider, createTheme, useColorScheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import type {} from '@mui/material/themeCssVarsAugmentation'

// Context Imports
import { ThemeContextProvider, useTheme } from '@/contexts/ThemeContext'

// Type Imports
import type { SystemMode } from '@/types/core'

type InnerThemeProviderProps = {
  children: React.ReactNode
}

const InnerThemeProvider = ({ children }: InnerThemeProviderProps) => {
  const { systemMode } = useTheme()
  const { setMode: setMuiMode } = useColorScheme()

  // Sync MUI theme mode with our context
  useMemo(() => {
    setMuiMode(systemMode)
  }, [systemMode, setMuiMode])

  const theme = useMemo(() => {
    return createTheme({
      colorSchemes: {
        light: {
          palette: {
            primary: {
              main: '#696CFF'
            }
          }
        },
        dark: {
          palette: {
            primary: {
              main: '#696CFF'
            }
          }
        }
      },
      cssVariables: {
        colorSchemeSelector: 'data'
      }
    })
  }, [])

  return (
    <MuiThemeProvider theme={theme} defaultMode={systemMode}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}

type Props = {
  children: React.ReactNode
  initialMode?: 'system' | 'light' | 'dark'
}

const ThemeProvider = ({ children, initialMode }: Props) => {
  return (
    <AppRouterCacheProvider options={{ prepend: true }}>
      <ThemeContextProvider initialMode={initialMode}>
        <InnerThemeProvider>{children}</InnerThemeProvider>
      </ThemeContextProvider>
    </AppRouterCacheProvider>
  )
}

export default ThemeProvider

