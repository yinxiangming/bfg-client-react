'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import {
  listInboxMessages,
  markInboxMessageRead,
  markInboxMessageUnread,
  markAllInboxMessagesRead,
  bulkMarkInboxMessagesRead,
  bulkMarkInboxMessagesUnread,
  bulkDeleteInboxMessages,
  type InboxMessage
} from '@/services/inbox'

import { getIntlLocale } from '@/utils/format'

function getSenderDisplayName(message: InboxMessage, systemLabel: string): string {
  if (message.sender_name) return message.sender_name

  const sender = message.sender
  if (!sender) return systemLabel

  const fullName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim()
  if (fullName) return fullName

  return sender.email || systemLabel
}

function formatDate(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(getIntlLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getMessageSubject(message: InboxMessage, noSubjectLabel: string): string {
  return message.message_subject || noSubjectLabel
}

function getMessageContent(message: InboxMessage): string {
  return message.message_content || ''
}

function getMessageDisplayTime(message: InboxMessage): string {
  return message.delivered_at || message.created_at || ''
}

const Alerts = () => {
  const t = useTranslations('account.alerts')

  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize])
  const allSelected = useMemo(
    () => messages.length > 0 && messages.every(m => selectedIds.has(m.id)),
    [messages, selectedIds]
  )
  const someSelected = useMemo(() => selectedIds.size > 0 && !allSelected, [selectedIds, allSelected])

  const fetchMessages = useCallback(
    async (page: number) => {
      try {
        setLoading(true)
        setError(null)

        const response = await listInboxMessages({ page, pageSize })
        setMessages(response.results || [])
        setTotalCount(response.count || 0)
      } catch (err: any) {
        const message = err?.message || t('failedFetch')
        setError(message)
        setMessages([])
        setTotalCount(0)
      } finally {
        setLoading(false)
      }
    },
    [pageSize]
  )

  useEffect(() => {
    fetchMessages(currentPage)
  }, [fetchMessages, currentPage])

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
    setSelectedIds(new Set()) // Clear selection when changing page
  }

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(messages.map(m => m.id)))
    }
  }

  const handleToggleSelect = (messageId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllInboxMessagesRead()
      setSnackbar({
        open: true,
        message: t('markedRead', { count: result.updated_count }),
        severity: 'success'
      })
      await fetchMessages(currentPage)
      setSelectedIds(new Set())
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.message || t('failedMarkRead'),
        severity: 'error'
      })
    }
  }

  const handleBulkMarkRead = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    try {
      const result = await bulkMarkInboxMessagesRead(ids)
      setSnackbar({
        open: true,
        message: t('markedRead', { count: result.updated_count }),
        severity: 'success'
      })
      await fetchMessages(currentPage)
      setSelectedIds(new Set())
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.message || t('failedMarkMessages'),
        severity: 'error'
      })
    }
  }

  const handleBulkMarkUnread = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    try {
      const result = await bulkMarkInboxMessagesUnread(ids)
      setSnackbar({
        open: true,
        message: t('markedUnread', { count: result.updated_count }),
        severity: 'success'
      })
      await fetchMessages(currentPage)
      setSelectedIds(new Set())
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.message || t('failedMarkUnread'),
        severity: 'error'
      })
    }
  }

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    setConfirmDialog({
      open: true,
      title: t('deleteTitle'),
      message: t('deleteConfirm', { count: ids.length }),
      onConfirm: async () => {
        try {
          const result = await bulkDeleteInboxMessages(ids)
          setSnackbar({
            open: true,
            message: t('deleted', { count: result.deleted_count }),
            severity: 'success'
          })
          await fetchMessages(currentPage)
          setSelectedIds(new Set())
        } catch (err: any) {
          setSnackbar({
            open: true,
            message: err?.message || t('failedDelete'),
            severity: 'error'
          })
        }
        setConfirmDialog(prev => ({ ...prev, open: false }))
      }
    })
  }

  const handleCloseConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }))
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const handleOpenView = async (message: InboxMessage, event?: React.MouseEvent) => {
    if (event) event.stopPropagation()
    setSelectedMessage(message)
    setOpenViewDialog(true)

    if (message.is_read) return

    // Optimistic update + sync with server response
    setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, is_read: true } : m)))
    setSelectedMessage(prev => (prev && prev.id === message.id ? { ...prev, is_read: true } : prev))

    try {
      const updated = await markInboxMessageRead(message.id)
      setMessages(prev => prev.map(m => (m.id === message.id ? updated : m)))
      setSelectedMessage(prev => (prev && prev.id === message.id ? updated : prev))
    } catch {
      // If mark_read fails, revert optimistic update (best-effort)
      setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, is_read: false } : m)))
      setSelectedMessage(prev => (prev && prev.id === message.id ? { ...prev, is_read: false } : prev))
    }
  }

  const handleCloseView = () => {
    setOpenViewDialog(false)
    setSelectedMessage(null)
  }

  return (
    <>
      <Card
        variant='outlined'
        sx={{
          borderRadius: 2,
          boxShadow: 'none',
          border: theme => `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Typography variant='h6'>{t('title')}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {totalCount} {t('total')}
            </Typography>
          </Box>

          {/* Bulk Actions Toolbar */}
          {messages.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={handleToggleSelectAll}
                size='small'
              />
              <Typography variant='body2' color='text.secondary' sx={{ mr: 'auto' }}>
                {selectedIds.size > 0 ? `${selectedIds.size} ${t('selected')}` : t('selectAll')}
              </Typography>

              <Button size='small' onClick={handleMarkAllRead} disabled={loading}>
                {t('markAllRead')}
              </Button>

              {selectedIds.size > 0 && (
                <ButtonGroup size='small' variant='outlined'>
                  <Button onClick={handleBulkMarkRead}>
                    <i className='tabler-mail' style={{ marginRight: 4 }} />
                    {t('read')}
                  </Button>
                  <Button onClick={handleBulkMarkUnread}>
                    <i className='tabler-mail-opened' style={{ marginRight: 4 }} />
                    {t('unread')}
                  </Button>
                  <Button onClick={handleBulkDelete} color='error'>
                    <i className='tabler-trash' style={{ marginRight: 4 }} />
                    {t('delete')}
                  </Button>
                </ButtonGroup>
              )}
            </Box>
          )}

          {error && (
            <Alert severity='error' sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box className='text-center py-8'>
              <Typography variant='body1' className='mbe-4'>
                {t('noMessages')}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('emptyInbox')}
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Divider />} spacing={0}>
              {messages.map(message => {
                const subject = getMessageSubject(message, t('noSubject'))
                const from = getSenderDisplayName(message, t('system'))
                const createdAt = formatDate(getMessageDisplayTime(message))
                const isRead = Boolean(message.is_read)
                const isSelected = selectedIds.has(message.id)

                return (
                  <Box
                    key={message.id}
                    onClick={e => handleOpenView(message, e)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 2,
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' }
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggleSelect(message.id)}
                      onClick={e => e.stopPropagation()}
                      size='small'
                    />

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: isRead ? 500 : 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {subject}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                        {from}
                        {createdAt ? ` • ${createdAt}` : ''}
                      </Typography>
                    </Box>

                    <Chip size='small' label={isRead ? t('read') : t('unread')} color={isRead ? 'default' : 'primary'} />
                  </Box>
                )
              })}
            </Stack>
          )}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={openViewDialog} onClose={handleCloseView} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant='h6' sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {selectedMessage ? getMessageSubject(selectedMessage, t('noSubject')) : t('noSubject')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedMessage && (
                  <Chip
                    size='small'
                    label={selectedMessage.is_read ? t('read') : t('unread')}
                    color={selectedMessage.is_read ? 'default' : 'primary'}
                  />
                )}
                <IconButton
                  aria-label='close'
                  onClick={handleCloseView}
                  size='small'
                  sx={{
                    color: theme => theme.palette.grey[500]
                  }}
                >
                  <i className='tabler-x' />
                </IconButton>
              </Box>
            </Box>
            <Typography variant='body2' color='text.secondary'>
              {selectedMessage ? getSenderDisplayName(selectedMessage, t('system')) : ''}
              {selectedMessage ? (() => {
                const ts = getMessageDisplayTime(selectedMessage)
                return ts ? ` • ${formatDate(ts)}` : ''
              })() : ''}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 200 }}>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedMessage ? getMessageContent(selectedMessage) : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView} variant='contained'>
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
        aria-labelledby='confirm-dialog-title'
        aria-describedby='confirm-dialog-description'
      >
        <DialogTitle id='confirm-dialog-title'>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id='confirm-dialog-description'>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color='secondary'>
            {t('cancel')}
          </Button>
          <Button onClick={confirmDialog.onConfirm} color='error' variant='contained' autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Alerts

