'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Box
} from '@mui/material'
import Link from 'next/link'
import { getWorkspaces } from '@/services/platform-api'
import { getPlatformToken } from '@/utils/authTokens'

export default function WorkspaceTable() {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        if (!getPlatformToken()) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const data = await getWorkspaces()
        // Adjust depending on whether it returns an array or paginated object
        const results = Array.isArray(data) ? data : (data.results || [])
        setWorkspaces(results)
      } catch (err: any) {
        setError(err.message || 'Failed to load workspaces')
      } finally {
        setLoading(false)
      }
    }
    
    loadWorkspaces()
  }, [])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  if (error) return <Typography color="error">{error}</Typography>
  if (workspaces.length === 0) return <Typography color="text.secondary">No workspaces found.</Typography>

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table sx={{ minWidth: 650 }} aria-label="workspaces table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Slug</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {workspaces.map((workspace) => (
            <TableRow key={workspace.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row">
                <Typography variant="subtitle2">{workspace.name}</Typography>
              </TableCell>
              <TableCell>{workspace.slug}</TableCell>
              <TableCell>
                <Chip 
                  label={workspace.status || 'Active'} 
                  color={workspace.status === 'suspended' ? 'error' : 'success'} 
                  size="small" 
                />
              </TableCell>
              <TableCell>{workspace.plan_name || 'Free'}</TableCell>
              <TableCell align="right">
                <Button 
                  variant="text" 
                  component={Link} 
                  href={`/admin/platform/workspaces/${workspace.id}`}
                  size="small"
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
