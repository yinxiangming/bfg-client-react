'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWorkspace, getWorkspaceBaseUrl, tokenExchange } from '@/services/platform-api'
import { Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { SettingsSection } from '@/components/admin/settings/SettingsSection'
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
    <Box>
      <AdminPageHeader
        title={workspace.name}
        actions={
          <>
            <Button component={Link} href="/admin/platform" variant="outlined" disabled={exchanging}>
              Back to Platform
            </Button>
            <Button variant="contained" color="primary" onClick={handleEnterWorkspace} disabled={exchanging}>
              {exchanging ? 'Entering...' : 'Enter Admin Panel'}
            </Button>
          </>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
        }}
      >
        {/* One surface: the two sections are separated by the hairline
            SettingsSection draws, not by a gap between two cards. */}
        <Card>
          <SettingsSection title="Workspace Details" flush>
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
          </SettingsSection>

          <SettingsSection title="Backend Connection">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {EMBEDDED
                ? 'This workspace runs on the same server (embedded mode). API requests use the X-Workspace-ID header to select the workspace context.'
                : 'This workspace is provisioned on the platform. API requests will include the X-Workspace-ID header and route to the connected BFG workspace API.'
              }
            </Typography>
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                API Endpoint: {getWorkspaceBaseUrl()}/api/v1/
              </Typography>
            </Box>
          </SettingsSection>
        </Card>

        <Box>
          <Card>
            <CardContent>
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, mb: 2 }}>Subscription</Typography>
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
