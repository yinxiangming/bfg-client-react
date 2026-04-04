'use client'

/**
 * Platform Dashboard — /admin/platform
 * Overview of all workspaces the current user manages.
 */

import WorkspaceGrid from '@/components/platform/WorkspaceGrid'
import Link from 'next/link'
import Button from '@mui/material/Button'

export default function PlatformDashboardPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <Button variant="contained" component={Link} href="/admin/platform/workspaces/new">
          Create Workspace
        </Button>
      </div>
      <p className="text-muted-foreground mb-6">
        Manage your workspaces, subscriptions, and platform settings.
      </p>
      <WorkspaceGrid />
    </div>
  )
}
