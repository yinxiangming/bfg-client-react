'use client'

import { useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import type { ColorMode } from '@/utils/storefrontConfig'

type SkinColorModeGuardProps = {
  supportedColorModes?: ColorMode[]
  children: React.ReactNode
}

/** Keeps the shared app chrome aligned with the active skin's capabilities. */
export default function SkinColorModeGuard({ supportedColorModes, children }: SkinColorModeGuardProps) {
  const { forceMode } = useTheme()
  const forcedMode = supportedColorModes?.length === 1 ? supportedColorModes[0] : null

  useEffect(() => {
    forceMode(forcedMode)
    return () => forceMode(null)
  }, [forceMode, forcedMode])

  return <>{children}</>
}
