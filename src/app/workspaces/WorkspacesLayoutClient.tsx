'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { AdminSkinProvider } from '@/contexts/AdminSkinContext'
import { useWorkspaceChangeReload } from '@/hooks/useWorkspaceChangeReload'
import { authApi } from '@/utils/authApi'

import WorkspacesTopbar from './WorkspacesTopbar'

type Props = {
  children: React.ReactNode
}

export default function WorkspacesLayoutClient({ children }: Props) {
  const router = useRouter()
  // The token lives in localStorage, out of the server's sight: render nothing until the
  // browser has looked, then show the page or send the visitor to sign in.
  const [signedIn, setSignedIn] = useState(false)

  // The page marks the workspace the token belongs to as current. Another tab switching
  // workspace changes that token, so reload rather than keep a stale mark.
  useWorkspaceChangeReload()

  useEffect(() => {
    if (authApi.isAuthenticated()) {
      setSignedIn(true)
    } else {
      router.replace('/auth/login?redirect=/workspaces')
    }
  }, [router])

  // The admin's MUI overrides (components/theme/adminSurface.ts) apply only under the
  // data-admin-skin attribute that AdminSkinProvider puts on <html>. It mounts before the
  // guard lets content render, so the first content paint already has the attribute.
  return (
    <AdminSkinProvider>
      {signedIn && (
        <div className='flex min-h-screen flex-col'>
          <WorkspacesTopbar />
          <main className='flex-1'>{children}</main>
        </div>
      )}
    </AdminSkinProvider>
  )
}
