// Server Component - lists the deployed plugins; the client picks the ones this workspace has on
import { adminNavItems } from '@/data/adminNavItems'
import { loadExtensions } from '@/extensions'
import AdminSkinFonts from '@/components/theme/AdminSkinFonts'
import AdminLayoutClient from './AdminLayoutClient'

export const metadata = {
  title: { template: 'Admin - %s', default: 'Admin' },
  // Back-office: never index, and don't follow links out of it into private surfaces.
  robots: { index: false, follow: false, nocache: true },
}

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const extensions = await loadExtensions()

  if (process.env.NODE_ENV === 'development') {
    console.log('[AdminLayout] Extensions:', extensions.map(e => e.id))
  }

  // Only ids cross to the client: which plugins a workspace has switched on is known
  // there, from /api/v1/me/, and the client applies their nav entries itself.
  const extensionIds = extensions.map(e => e.id)

  return (
    <>
      <AdminSkinFonts />
      <AdminLayoutClient
        navItems={adminNavItems}
        extensionIds={extensionIds}
      >
        {children}
      </AdminLayoutClient>
    </>
  )
}
