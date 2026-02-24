'use client'

import React from 'react'
import { THEME_REGISTRY } from '@/components/storefront/themes/registry.generated'
import { DEFAULT_THEME_ID } from '@/utils/storefrontConfig'

const DEFAULT_MODE = 'light'

type ThemeShellProps = {
  theme: string
  children: React.ReactNode
}

/** Picks Layout from THEME_REGISTRY by theme and renders it. Fallback to store. */
export default function ThemeShell({ theme, children }: ThemeShellProps) {
  const shell = THEME_REGISTRY[theme] ?? THEME_REGISTRY[DEFAULT_THEME_ID]
  const Layout = shell.Layout
  return <Layout mode={DEFAULT_MODE}>{children}</Layout>
}
