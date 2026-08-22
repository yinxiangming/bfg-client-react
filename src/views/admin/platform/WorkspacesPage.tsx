'use client'

/**
 * Workspace List — /admin/platform/workspaces
 */
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import WorkspaceTable from '@/components/platform/WorkspaceTable'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

export default function WorkspacesPage() {
  return (
    <Box>
      <AdminPageHeader
        title='Workspaces'
        actions={
          <Button
            variant='contained'
            component={Link}
            href='/admin/platform/workspaces/new'
            startIcon={<i className='tabler-plus' />}
          >
            New Workspace
          </Button>
        }
      />
      <WorkspaceTable />
    </Box>
  )
}
