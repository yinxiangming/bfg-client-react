'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWorkspace, getWorkspaceBaseUrl, tokenExchange } from '@/services/platform-api'
import { Box, Button, Card, CardContent, CircularProgress, Typography, Divider } from '@mui/material'
import { getPlatformToken, setAccessTokenCookie, setWorkspaceToken } from '@/utils/authTokens'

const EMBEDDED = process.env.NEXT_PUBLIC_PLATFORM_EMBEDDED === 'true'

export default function WorkspaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exchanging, setExchanging] = useState(false)

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const token = getPlatformToken()
        if (!token) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const data = await getWorkspace(Number(id), token)
        setWorkspace(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load workspace details')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspace()
  }, [id])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
  if (error) return <Typography color="error" sx={{ p: 4 }}>{error}</Typography>
  if (!workspace) return <Typography sx={{ p: 4 }}>Workspace not found</Typography>

  const handleEnterWorkspace = async () => {
    setExchanging(true)
    try {
      const platformToken = getPlatformToken()
      if (!platformToken) {
        router.push('/auth/login')
        return
      }

      if (EMBEDDED) {
        // ── Embedded mode: same JWT, just switch workspace context ──
        setWorkspaceToken(platformToken)
        setAccessTokenCookie(platformToken)
        localStorage.setItem('current_workspace_id', String(workspace.id))
        document.cookie = `workspace_id=${workspace.id}; path=/;`
        router.push('/admin/dashboard')
      } else {
        // ── Standalone mode: Token Exchange ──
        const result = await tokenExchange(workspace.id, platformToken)

        if (!result.workspace_token) {
          throw new Error('Token exchange did not return a workspace token')
        }

        if (result.workspace_url) {
          localStorage.setItem('workspace_api_url', result.workspace_url)
        }

        setWorkspaceToken(result.workspace_token)
        setAccessTokenCookie(result.workspace_token)

        localStorage.setItem('current_workspace_id', String(workspace.id))
        document.cookie = `workspace_id=${workspace.id}; path=/;`

        router.push('/admin/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enter workspace')
      setExchanging(false)
    }
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {workspace.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button component={Link} href="/admin/platform" variant="outlined" disabled={exchanging}>
            Back to Platform
          </Button>
          <Button variant="contained" color="primary" onClick={handleEnterWorkspace} disabled={exchanging}>
            {exchanging ? 'Entering...' : 'Enter Admin Panel'}
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 4,
        }}
      >
        <Box>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Workspace Details</Typography>
              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography color="text.secondary" variant="body2">ID</Typography>
                  <Typography variant="body1">{workspace.id}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="body2">Slug</Typography>
                  <Typography variant="body1">{workspace.slug}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="body2">Status</Typography>
                  <Typography variant="body1">{workspace.status || 'Active'}</Typography>
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="body2">Created At</Typography>
                  <Typography variant="body1">
                    {workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Backend Connection</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" paragraph>
                {EMBEDDED
                  ? 'This workspace runs on the same server (embedded mode). API requests use the X-Workspace-ID header to select the workspace context.'
                  : 'This workspace is provisioned on the platform. API requests will include the X-Workspace-ID header and route to the connected BFG workspace API.'
                }
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  API Endpoint: {getWorkspaceBaseUrl()}/api/v1/
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Subscription</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">Current Plan</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{workspace.plan?.name || 'Free Tier'}</Typography>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => alert('Billing management coming soon')}
              >
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}
