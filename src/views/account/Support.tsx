'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Pagination from '@mui/material/Pagination'
import CustomTextField from '@/components/ui/TextField'
import { meApi } from '@/utils/meApi'

interface Ticket {
  id: number
  ticket_number: string
  subject: string
  description?: string
  status: string
  priority_name?: string
  category_name?: string
  created_at?: string
  updated_at?: string
}

const PAGE_SIZE = 10

const Support = () => {
  const t = useTranslations('account.support')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [options, setOptions] = useState<{
    ticket_statuses: { value: string; label: string }[]
    ticket_priorities: { value: number; label: string }[]
    ticket_categories: { value: number; label: string }[]
  } | null>(null)
  const [formSubject, setFormSubject] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<number | ''>('')
  const [formPriority, setFormPriority] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const fetchTickets = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await meApi.getTickets({ page, page_size: PAGE_SIZE })
      const data = response.results ?? response.data
      const list = Array.isArray(data) ? data : []
      setTickets(list)
      setTotalCount(response.count ?? list.length)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('failedLoad'))
      setTickets([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    try {
      const data = await meApi.getSupportOptions()
      setOptions(data)
    } catch {
      setOptions(null)
    }
  }

  useEffect(() => {
    fetchTickets(currentPage)
  }, [currentPage])

  useEffect(() => {
    if (createOpen) fetchOptions()
  }, [createOpen])

  const handleCreateOpen = () => {
    setFormSubject('')
    setFormDescription('')
    setFormCategory('')
    setFormPriority('')
    setCreateOpen(true)
  }

  const handleCreateSubmit = async () => {
    if (!formSubject.trim() || !formDescription.trim()) return
    try {
      setSubmitting(true)
      await meApi.createTicket({
        subject: formSubject.trim(),
        description: formDescription.trim(),
        category: formCategory === '' ? undefined : Number(formCategory),
        priority: formPriority === '' ? undefined : Number(formPriority)
      })
      setCreateOpen(false)
      await fetchTickets(1)
      setCurrentPage(1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('failedCreate'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewDetail = async (ticket: Ticket) => {
    try {
      const full = await meApi.getTicket(ticket.id)
      setSelectedTicket(full)
      setDetailOpen(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('failedLoad'))
    }
  }

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'info'
      case 'open':
      case 'pending':
        return 'warning'
      case 'resolved':
        return 'success'
      case 'closed':
        return 'default'
      case 'on_hold':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    const key = status?.toLowerCase()
    const map: Record<string, string> = {
      new: 'statusNew',
      open: 'statusOpen',
      pending: 'statusPending',
      on_hold: 'statusOnHold',
      resolved: 'statusResolved',
      closed: 'statusClosed'
    }
    return key && map[key] ? t(map[key]) : (status || '—')
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Card variant='outlined' sx={{ boxShadow: 'none', borderRadius: 2 }}>
          <CardContent sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
            {error && (
              <Alert severity='error' className='mbe-4' onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant='h6' fontWeight={600}>
                {t('myTickets')}
              </Typography>
              <Button variant='contained' onClick={handleCreateOpen} startIcon={<i className='tabler-plus' />}>
                {t('newTicket')}
              </Button>
            </Box>
            {loading ? (
              <Typography color='text.secondary'>{t('loading')}</Typography>
            ) : tickets.length === 0 ? (
              <Box className='text-center py-8'>
                <Typography variant='body1' color='text.secondary' className='mbe-4'>
                  {t('noTickets')}
                </Typography>
                <Button variant='contained' onClick={handleCreateOpen}>
                  {t('newTicket')}
                </Button>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size='medium' sx={{ minWidth: 500 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('ticketNumber')}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('subject')}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('status')}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('createdAt')}</TableCell>
                        <TableCell align='right' sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tickets.map(ticket => (
                        <TableRow key={ticket.id} hover>
                          <TableCell sx={{ py: 1.75 }}>
                            <Typography variant='body2' fontWeight={600}>
                              {ticket.ticket_number}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.75 }}>
                            <Typography variant='body2' noWrap sx={{ maxWidth: 280 }}>
                              {ticket.subject}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.75 }}>
                            <Chip
                              label={getStatusLabel(ticket.status)}
                              color={getStatusColor(ticket.status)}
                              size='small'
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1.75 }}>
                            <Typography variant='body2' color='text.secondary'>
                              {formatDate(ticket.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell align='right' sx={{ py: 1.75 }}>
                            <Button size='small' variant='text' onClick={() => handleViewDetail(ticket)}>
                              {t('view')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(_, page) => setCurrentPage(page)}
                      color='primary'
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Create ticket dialog */}
      <Dialog open={createOpen} onClose={() => !submitting && setCreateOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('newTicket')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <CustomTextField
              label={t('subject')}
              value={formSubject}
              onChange={e => setFormSubject(e.target.value)}
              required
              fullWidth
              placeholder={t('subjectPlaceholder')}
            />
            <CustomTextField
              label={t('description')}
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              required
              fullWidth
              multiline
              rows={4}
              placeholder={t('descriptionPlaceholder')}
            />
            {options && options.ticket_categories?.length > 0 && (
              <CustomTextField
                select
                label={t('category')}
                value={formCategory === '' ? '' : String(formCategory)}
                onChange={e => setFormCategory(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value=''>{t('categoryOptional')}</option>
                {options.ticket_categories.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </CustomTextField>
            )}
            {options && options.ticket_priorities?.length > 0 && (
              <CustomTextField
                select
                label={t('priority')}
                value={formPriority === '' ? '' : String(formPriority)}
                onChange={e => setFormPriority(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value=''>{t('priorityOptional')}</option>
                {options.ticket_priorities.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </CustomTextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={submitting}>
            {t('cancel')}
          </Button>
          <Button
            variant='contained'
            onClick={handleCreateSubmit}
            disabled={submitting || !formSubject.trim() || !formDescription.trim()}
          >
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {selectedTicket?.ticket_number} — {selectedTicket?.subject}
        </DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={getStatusLabel(selectedTicket.status)}
                  color={getStatusColor(selectedTicket.status)}
                  size='small'
                />
                {selectedTicket.priority_name && (
                  <Typography variant='body2' color='text.secondary'>
                    {t('priority')}: {selectedTicket.priority_name}
                  </Typography>
                )}
                {selectedTicket.category_name && (
                  <Typography variant='body2' color='text.secondary'>
                    {t('category')}: {selectedTicket.category_name}
                  </Typography>
                )}
              </Box>
              <Typography variant='body2' color='text.secondary'>
                {t('createdAt')}: {formatDate(selectedTicket.created_at)}
              </Typography>
              {selectedTicket.updated_at && (
                <Typography variant='body2' color='text.secondary'>
                  {t('updatedAt')}: {formatDate(selectedTicket.updated_at)}
                </Typography>
              )}
              <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedTicket.description || '—'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>{t('close')}</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default Support
