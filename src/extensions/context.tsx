'use client'

import { createContext, useContext, useMemo, useEffect, useState, ReactNode } from 'react'
import { loadExtensions } from '@/extensions'
import type { Extension, PageSectionExtension, DataHookExtension } from './registry'

interface ExtensionContextValue {
  extensions: Extension[]
  getPageSections: (page: string) => PageSectionExtension[]
  getDataHooks: (page: string) => DataHookExtension[]
}

const ExtensionContext = createContext<ExtensionContextValue | null>(null)

/**
 * Loads extensions by ids (from server) then provides them via ExtensionProvider.
 * Shared by admin and storefront layouts.
 */
export function ExtensionLoaderProvider({
  extensionIds,
  children
}: {
  extensionIds: string[]
  children: ReactNode
}) {
  const [extensions, setExtensions] = useState<Extension[]>([])

  useEffect(() => {
    if (extensionIds.length === 0) {
      setExtensions([])
      return
    }
    loadExtensions(extensionIds)
      .then(setExtensions)
      .catch((err) => console.error('[ExtensionLoaderProvider] Failed to load extensions:', err))
  }, [extensionIds.join(',')])

  return <ExtensionProvider extensions={extensions}>{children}</ExtensionProvider>
}

export function ExtensionProvider({ 
  extensions, 
  children 
}: { 
  extensions: Extension[]
  children: ReactNode 
}) {
  const value = useMemo(() => ({
    extensions,
    getPageSections: (page: string) => {
      return extensions
        .flatMap(e => e.sections || [])
        .filter(s => s.page === page)
        .sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100))
    },
    getDataHooks: (page: string) => {
      return extensions
        .flatMap(e => e.dataHooks || [])
        .filter(h => h.page === page)
        .sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100))
    }
  }), [extensions])

  return (
    <ExtensionContext.Provider value={value}>
      {children}
    </ExtensionContext.Provider>
  )
}

export const useExtensions = () => useContext(ExtensionContext)
