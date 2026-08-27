'use client'

/**
 * Marks the document as a storefront page.
 *
 * `styles/admin.css` paints `[data-mode='dark'] body` the back office's
 * #28243d — a purple-tinted neutral — and that rule is not scoped, so it was
 * also the page colour behind the shop. The storefront's own surfaces are a
 * plain neutral scale (#1f1f1f header, #1a1a1a sections, #2d2d2d cards), so
 * the purple only ever appeared as a mismatched frame around them: down both
 * margins, and in the gap between the hero and the first section.
 *
 * This mirrors `AdminSkinProvider`, which puts `data-admin-skin` on <html> for
 * admin routes: the attribute goes on the root element rather than a layout
 * div so it also reaches portalled surfaces, and is cleared on unmount so it
 * never lingers into another route group.
 */

import { useEffect } from 'react'

export default function StorefrontSurface() {
  useEffect(() => {
    document.documentElement.setAttribute('data-storefront', '')
    return () => document.documentElement.removeAttribute('data-storefront')
  }, [])

  return null
}
