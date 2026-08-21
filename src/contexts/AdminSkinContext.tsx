'use client'

// React Imports
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type AdminSkin = 'slate' | 'compact' | 'carbon'

export const ADMIN_SKINS: { id: AdminSkin; label: string }[] = [
  { id: 'slate', label: 'Slate' },
  { id: 'compact', label: 'Compact' },
  { id: 'carbon', label: 'Carbon' }
]

const SKIN_STORAGE_KEY = 'admin-skin'
const DEFAULT_SKIN: AdminSkin = 'slate'

const isAdminSkin = (value: unknown): value is AdminSkin =>
  value === 'slate' || value === 'compact' || value === 'carbon'

type AdminSkinContextType = {
  skin: AdminSkin
  setSkin: (skin: AdminSkin) => void
  skins: typeof ADMIN_SKINS
}

const AdminSkinContext = createContext<AdminSkinContextType | undefined>(undefined)

const getStoredSkin = (): AdminSkin => {
  if (typeof window === 'undefined') return DEFAULT_SKIN
  try {
    const stored = localStorage.getItem(SKIN_STORAGE_KEY)
    if (isAdminSkin(stored)) return stored
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_SKIN
}

function applySkin(skin: AdminSkin) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-admin-skin', skin)
}

export const AdminSkinProvider = ({ children }: { children: React.ReactNode }) => {
  const [skin, setSkinState] = useState<AdminSkin>(() => getStoredSkin())

  // Apply on mount and whenever skin changes. The skin attribute lives on
  // <html> so MUI portals (Menu/Dialog) inherit the tokens too. Clear it on
  // unmount so it never lingers into non-admin route groups.
  useEffect(() => {
    applySkin(skin)
    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-admin-skin')
      }
    }
  }, [skin])

  const setSkin = useCallback((next: AdminSkin) => {
    setSkinState(next)
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, next)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  return (
    <AdminSkinContext.Provider value={{ skin, setSkin, skins: ADMIN_SKINS }}>
      {children}
    </AdminSkinContext.Provider>
  )
}

export const useAdminSkin = (): AdminSkinContextType => {
  const context = useContext(AdminSkinContext)
  if (context) return context

  // The skin switcher lives in the shared Topbar, which also renders in the
  // account area where no AdminSkinProvider wraps the tree. Fall back to a
  // functional, non-reactive shim (reads/writes localStorage and applies the
  // attribute) instead of throwing and crashing the whole page.
  return {
    skin: getStoredSkin(),
    setSkin: (next: AdminSkin) => {
      applySkin(next)
      try {
        localStorage.setItem(SKIN_STORAGE_KEY, next)
      } catch {
        // Ignore localStorage errors
      }
    },
    skins: ADMIN_SKINS,
  }
}
