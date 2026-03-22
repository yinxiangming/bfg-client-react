'use client'

import { createContext, useContext, useMemo, useEffect, useState, ReactNode } from 'react'
import { loadPluginExtensions } from './loadExtensionsCore'
import type { Extension, PageSlotExtension, DataHookExtension } from './registry'

interface ExtensionContextValue {
  extensions: Extension[]
  getPageSlots: (page: string) => PageSlotExtension[]
  /** @deprecated Use getPageSlots */
  getPageSections: (page: string) => PageSlotExtension[]
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
    loadPluginExtensions(extensionIds)
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
    getPageSlots: (page: string) => {
      return extensions
        .flatMap((e) => e.sections || [])
        .filter((s) => s.page === page)
        .sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100))
    },
    getPageSections: (page: string) => {
      return extensions
        .flatMap((e) => e.sections || [])
        .filter((s) => s.page === page)
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
