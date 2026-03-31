'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { authApi } from '@/utils/authApi'
import { meApi } from '@/utils/meApi'

export default function MobileAdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/admin/m')}`)
      return
    }
    meApi.getMe().then((user: any) => {
      if (!user?.is_staff) {
        router.push('/admin')
        return
      }
      setReady(true)
    }).catch(() => {
      router.push(`/auth/login?redirect=${encodeURIComponent('/admin/m')}`)
    })
  }, [router])

  if (!ready) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box component='main' sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
      {children}
    </Box>
  )
}
