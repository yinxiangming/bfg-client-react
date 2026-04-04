'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@mui/material'
import { getMyWorkspaces } from '@/services/platform-api'
import { getPlatformToken } from '@/utils/authTokens'
import Link from 'next/link'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useRouter } from 'next/navigation'

export default function WorkspaceGrid() {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        if (!getPlatformToken()) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const data = await getMyWorkspaces()
        // Extract workspaces from response (the API returns { workspaces, is_platform_admin })
        const results = data.workspaces || []

        // Auto-redirect if user only has 1 workspace
        if (results.length === 1 && !data.is_platform_admin) {
          router.push(`/admin/platform/workspaces/${results[0].id}`)
          return
        }

        setWorkspaces(results)
      } catch (err: any) {
        setError(err.message || 'Failed to load workspaces')
      } finally {
        setLoading(false)
      }
    }

    loadWorkspaces()
  }, [router])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  if (error) return <Typography color="error">{error}</Typography>
  if (workspaces.length === 0) return <Typography color="text.secondary">No workspaces found.</Typography>

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mt: 3 }}>
      {workspaces.map((workspace) => (
        <Card key={workspace.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardHeader title={workspace.name} subheader={workspace.slug} />
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Status: {workspace.status || 'Active'}
            </Typography>
            <Button
              variant="outlined"
              component={Link}
              href={`/admin/platform/workspaces/${workspace.id}`}
              fullWidth
            >
              Manage
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
