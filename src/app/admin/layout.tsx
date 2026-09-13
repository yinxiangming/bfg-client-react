// Server Component - lists the deployed plugins; the client picks the ones this workspace has on
import { adminNavItems } from '@/data/adminNavItems'
import { loadExtensions } from '@/extensions'
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
      {/* Skin display / mono fonts (graceful system fallbacks in admin-skins.css). */}
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
      <link
        rel='stylesheet'
        href='https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
      />
      <AdminLayoutClient
        navItems={adminNavItems}
        extensionIds={extensionIds}
      >
        {children}
      </AdminLayoutClient>
    </>
  )
}
