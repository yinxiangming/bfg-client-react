// Server Component - loads extensions and computes navigation
import { adminNavItems } from '@/data/adminNavItems'
import { loadExtensions, applyNavExtensions } from '@/extensions'
import AdminLayoutClient from './AdminLayoutClient'

export const metadata = {
  title: { template: 'Admin - %s', default: 'Admin' },
}

export default async function AdminLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Server-side: load extensions and compute final navigation
  const extensions = await loadExtensions()
  const navExtensions = extensions.flatMap(e => e.adminNav || [])
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[AdminLayout] Extensions:', extensions.map(e => e.id))
    console.log('[AdminLayout] Nav extensions:', navExtensions.length)
  }
  
  const finalNavItems = applyNavExtensions(
    adminNavItems,
    navExtensions,
    100
  )

  // Only pass serializable extension metadata to client
  // Functions (dataHooks) will be loaded on client side
  const extensionIds = extensions.map(e => e.id)

  return (
    <AdminLayoutClient 
      navItems={finalNavItems}
      extensionIds={extensionIds}
    >
      {children}
    </AdminLayoutClient>
  )
}

