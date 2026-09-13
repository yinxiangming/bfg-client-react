'use client'

/**
 * Puts the account area on the back office's slate surface.
 *
 * The customer account shares the admin's design language: the `--at-*` tokens
 * in `styles/admin-skins.css` and the MUI overrides in
 * `components/theme/adminSurface.ts`, which are scoped to `[data-admin-skin]`.
 * The shell already carries the attribute on its own wrapper, which covers the
 * first paint; this puts it on <html> too so portalled surfaces (Dialog, Menu,
 * Popover) pick it up. It is always `slate` here: the skin switcher is a back
 * office preference, and a shopper never sees it.
 *
 * Mirrors `AdminSkinProvider` and `StorefrontSurface`: cleared on unmount so it
 * never lingers into another route group.
 */

import { useEffect } from 'react'

export default function AccountSurface() {
  useEffect(() => {
    const root = document.documentElement

    root.setAttribute('data-admin-skin', 'slate')

    return () => root.removeAttribute('data-admin-skin')
  }, [])

  return null
}
