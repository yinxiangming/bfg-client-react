'use client'

/**
 * Platform Dashboard — /admin/platform
 * Overview of all workspaces the current user manages.
 */

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import WorkspaceGrid from '@/components/platform/WorkspaceGrid'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

export default function PlatformDashboardPage() {
  return (
    <Box>
      <AdminPageHeader
        title='Platform Dashboard'
        subtitle='Manage your workspaces, subscriptions, and platform settings.'
        actions={
          <Button variant='contained' component={Link} href='/admin/platform/workspaces/new'>
            Create Workspace
          </Button>
        }
      />
      <WorkspaceGrid />
    </Box>
  )
}
