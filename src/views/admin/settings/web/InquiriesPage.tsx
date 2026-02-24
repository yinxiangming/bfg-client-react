'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Icon } from '@iconify/react'

import { bfgApi, apiFetch } from '@/utils/api'

interface Inquiry {
  id: number
  inquiry_type: string
  type_display: string
  status: string
  status_display: string
  name: string
  email: string
  phone: string
  subject: string
  message?: string
  form_data?: Record<string, unknown>
  assigned_to?: number
  assigned_to_name?: string
  notes?: string
  notification_sent: boolean
  created_at: string
  updated_at: string
}

interface InquiryStats {
  total: number
  pending: number
  by_status: Record<string, number>
  by_type: Record<string, number>
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  cancelled: 'error',
}

const TYPE_ICONS: Record<string, string> = {
  booking: 'mdi:calendar-check',
  inquiry: 'mdi:email-outline',
  feedback: 'mdi:message-text',
  other: 'mdi:help-circle',
}

export function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [stats, setStats] = useState<InquiryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchInquiries = useCallback(async () => {
    try {
      setLoading(true)
      let url = bfgApi.inquiries()
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)
      if (params.toString()) url += `?${params.toString()}`

      const data = await apiFetch<{ results: Inquiry[] }>(url)
      setInquiries(data.results || [])
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter])

  const fetchStats = useCallback(async () => {
    try {
      const url = `${bfgApi.inquiries()}stats/`
      const data = await apiFetch<InquiryStats>(url)
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchInquiries()
    fetchStats()
  }, [fetchInquiries, fetchStats])

  const handleViewDetail = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setDetailDialogOpen(true)
  }

  const handleUpdateStatus = async (inquiryId: number, newStatus: string) => {
    try {
      await apiFetch(`${bfgApi.inquiries()}${inquiryId}/update-status/`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      })
      fetchInquiries()
      fetchStats()
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus })
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'inquiry_type',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon={TYPE_ICONS[params.row.inquiry_type] || 'mdi:help'} />
          <Typography variant='body2'>{params.row.type_display}</Typography>
        </Box>
      ),
    },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'subject', headerName: 'Subject', flex: 1.5 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          size='small'
          label={params.row.status_display}
          color={STATUS_COLORS[params.row.status] || 'default'}
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 160,
      renderCell: (params: GridRenderCellParams) =>
        new Date(params.row.created_at).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton size='small' onClick={() => handleViewDetail(params.row)}>
            <Icon icon='mdi:eye' />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h5' sx={{ mb: 3 }}>
        Customer Inquiries
      </Typography>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='h4'>{stats.total}</Typography>
                <Typography color='text.secondary'>Total Inquiries</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='h4' color='warning.main'>
                  {stats.pending}
                </Typography>
                <Typography color='text.secondary'>Pending</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='h4' color='success.main'>
                  {stats.by_status?.completed || 0}
                </Typography>
                <Typography color='text.secondary'>Completed</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant='h4'>{stats.by_type?.booking || 0}</Typography>
                <Typography color='text.secondary'>Bookings</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems='center'>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label='Status'
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='processing'>Processing</MenuItem>
                <MenuItem value='completed'>Completed</MenuItem>
                <MenuItem value='cancelled'>Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label='Type'
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='booking'>Booking</MenuItem>
                <MenuItem value='inquiry'>Inquiry</MenuItem>
                <MenuItem value='feedback'>Feedback</MenuItem>
                <MenuItem value='other'>Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button startIcon={<Icon icon='mdi:refresh' />} onClick={fetchInquiries}>
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 500 }}>
        <DataGrid
          rows={inquiries}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        {selectedInquiry && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant='h6'>Inquiry Details</Typography>
                <Chip
                  label={selectedInquiry.status_display}
                  color={STATUS_COLORS[selectedInquiry.status]}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Type
                  </Typography>
                  <Typography>{selectedInquiry.type_display}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Created
                  </Typography>
                  <Typography>
                    {new Date(selectedInquiry.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Name
                  </Typography>
                  <Typography>{selectedInquiry.name}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Email
                  </Typography>
                  <Typography>{selectedInquiry.email || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Phone
                  </Typography>
                  <Typography>{selectedInquiry.phone || '-'}</Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Subject
                  </Typography>
                  <Typography>{selectedInquiry.subject || '-'}</Typography>
                </Grid>
                <Grid size={12}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Message
                  </Typography>
                  <Paper variant='outlined' sx={{ p: 2, mt: 1 }}>
                    <Typography style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedInquiry.message}
                    </Typography>
                  </Paper>
                </Grid>

                {selectedInquiry.form_data &&
                  Object.keys(selectedInquiry.form_data).length > 0 && (
                    <Grid size={12}>
                      <Typography variant='subtitle2' color='text.secondary'>
                        Additional Fields
                      </Typography>
                      <Paper variant='outlined' sx={{ p: 2, mt: 1 }}>
                        {Object.entries(selectedInquiry.form_data).map(([key, value]) => (
                          <Box key={key} sx={{ mb: 1 }}>
                            <Typography variant='caption' color='text.secondary'>
                              {key}
                            </Typography>
                            <Typography>{String(value)}</Typography>
                          </Box>
                        ))}
                      </Paper>
                    </Grid>
                  )}

                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Update Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['pending', 'processing', 'completed', 'cancelled'].map((status) => (
                      <Button
                        key={status}
                        size='small'
                        variant={selectedInquiry.status === status ? 'contained' : 'outlined'}
                        color={STATUS_COLORS[status] === 'default' ? 'inherit' : STATUS_COLORS[status]}
                        onClick={() => handleUpdateStatus(selectedInquiry.id, status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default InquiriesPage
