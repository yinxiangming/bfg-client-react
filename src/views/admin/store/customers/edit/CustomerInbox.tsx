'use client'

// React Imports
import { useState, useEffect, useCallback, useMemo } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Pagination from '@mui/material/Pagination'
import Snackbar from '@mui/material/Snackbar'

// Component Imports
import SchemaTable from '@/components/schema/SchemaTable'
import SchemaForm from '@/components/schema/SchemaForm'

// Type Imports
import type { ListSchema, FormSchema } from '@/types/schema'
import { apiFetch, bfgApi } from '@/utils/api'
import { getIntlLocale } from '@/utils/format'

type CustomerInboxProps = {
  customerId: number
}

type Message = {
  id: number
  message_subject: string
  message_content: string
  created_at: string
  sender?: {
    id: number
    email: string
    first_name?: string
    last_name?: string
  }
  sender_name?: string
  is_read?: boolean
  delivered_at?: string
}

type MessagesResponse = {
  count: number
  next: string | null
  previous: string | null
  results: Message[]
}

const buildInboxSchema = (t: any): ListSchema => ({
  title: t('customers.inbox.schemas.messagesTitle'),
  columns: [
    { 
      field: 'message_subject', 
      label: t('common.labels.subject'), 
      type: 'string', 
      sortable: true,
      link: 'view'
    },
    { 
      field: 'sender_name', 
      label: t('common.labels.from'), 
      type: 'string',
      render: (value, row) => {
        if (row.sender) {
          const name = row.sender.first_name || row.sender.last_name 
            ? `${row.sender.first_name || ''} ${row.sender.last_name || ''}`.trim()
            : ''
          return name || row.sender.email || t('customers.inbox.system')
        }
        return value || t('customers.inbox.system')
      }
    },
    { 
      field: 'created_at', 
      label: t('common.labels.date'), 
      type: 'datetime', 
      sortable: true,
      render: (value) => {
        if (!value) return ''
        const date = new Date(value)
        return date.toLocaleDateString(getIntlLocale(), {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    },
    { 
      field: 'is_read', 
      label: t('common.labels.status'), 
      type: 'select',
      render: (value) => {
        return value ? t('customers.inbox.status.read') : t('customers.inbox.status.unread')
      }
    }
  ],
  searchFields: ['message_subject', 'message_content'],
  actions: [
    { id: 'view', label: t('customers.inbox.actions.view'), type: 'secondary', scope: 'row', icon: 'tabler-eye' }
  ]
})

const buildMessageDetailSchema = (t: any): FormSchema => ({
  title: t('customers.inbox.schemas.messageDetailsTitle'),
  blocks: [
    {
      title: t('customers.inbox.schemas.messageInfoTitle'),
      fields: [
        { field: 'message_subject', label: t('common.labels.subject'), type: 'string', readonly: true, fullWidth: true },
        { field: 'sender_name', label: t('common.labels.from'), type: 'string', readonly: true },
        { field: 'sender_email', label: t('common.labels.email'), type: 'string', readonly: true },
        { field: 'created_at', label: t('common.labels.date'), type: 'datetime', readonly: true },
        { field: 'is_read', label: t('common.labels.status'), type: 'select', readonly: true },
        { field: 'message_content', label: t('common.labels.message'), type: 'textarea', readonly: true, fullWidth: true, rows: 10 }
      ]
    }
  ]
})

const CustomerInbox = ({ customerId }: CustomerInboxProps) => {
  const t = useTranslations('admin')
  const inboxSchema = useMemo(() => buildInboxSchema(t), [t])
  const messageDetailSchema = useMemo(() => buildMessageDetailSchema(t), [t])

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [openSendDialog, setOpenSendDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const fetchMessages = useCallback(async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      const url = `${bfgApi.customers()}${customerId}/messages/?page=${page}&page_size=${pageSize}`
      const response = await apiFetch<MessagesResponse>(url)
      
      setMessages(response.results || [])
      setTotalCount(response.count || 0)
    } catch (err: any) {
      console.error('Failed to fetch messages', err)
      setError(err.message || t('customers.inbox.errors.fetchMessages'))
      setMessages([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [customerId, pageSize, t])

  useEffect(() => {
    fetchMessages(currentPage)
  }, [fetchMessages, currentPage])

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  const handleOpenSendDialog = () => {
    setOpenSendDialog(true)
  }

  const handleCloseSendDialog = () => {
    setOpenSendDialog(false)
    setSubject('')
    setMessage('')
  }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setSnackbar({
        open: true,
        message: t('customers.inbox.validation.subjectAndMessageRequired'),
        severity: 'warning'
      })
      return
    }

    setSending(true)
    try {
      await apiFetch(`${bfgApi.customers()}${customerId}/send-message/`, {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim()
        })
      })
      
      handleCloseSendDialog()
      await fetchMessages(currentPage)
      setSnackbar({
        open: true,
        message: t('customers.inbox.snackbar.sent'),
        severity: 'success'
      })
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: t('customers.inbox.snackbar.sendFailed', { error: error.message || '' }),
        severity: 'error'
      })
    } finally {
      setSending(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const handleRowClick = (item: Message) => {
    setSelectedMessage(item)
    setOpenViewDialog(true)
    // Note: We don't mark as read when viewing - this is intentional
    // The message will only be marked as read when the customer views it themselves
  }

  const handleActionClick = (action: { id: string }, item: Message) => {
    if (action.id === 'view') {
      handleRowClick(item)
    }
  }

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false)
    setSelectedMessage(null)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant='h6'>
              {t('customers.inbox.title', { count: totalCount })}
            </Typography>
            <Button variant='contained' onClick={handleOpenSendDialog}>
              {t('customers.inbox.sendMessage')}
            </Button>
          </Box>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <SchemaTable
            schema={inboxSchema}
            data={messages}
            loading={loading}
            onRowClick={handleRowClick}
            onActionClick={handleActionClick}
          />

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color='primary'
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog open={openSendDialog} onClose={handleCloseSendDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{t('customers.inbox.sendDialog.title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label={t('common.labels.subject')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label={t('common.labels.message')}
              multiline
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSendDialog}>{t('common.actions.cancel')}</Button>
          <Button variant='contained' onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()}>
            {sending ? t('common.states.sending') : t('common.actions.send')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth='md' fullWidth>
        <DialogContent
          sx={{
            p: 0,
            '& .MuiCard-root': { boxShadow: 'none' },
            '& .MuiCardContent-root': { p: 4 }
          }}
        >
          {selectedMessage && (
            <SchemaForm
              schema={messageDetailSchema}
              initialData={{
                ...selectedMessage,
                sender_email: selectedMessage.sender?.email || t('customers.inbox.system'),
                sender_name: selectedMessage.sender_name || 
                  (selectedMessage.sender 
                    ? `${selectedMessage.sender.first_name || ''} ${selectedMessage.sender.last_name || ''}`.trim() || selectedMessage.sender.email
                    : t('customers.inbox.system')),
                is_read: selectedMessage.is_read ? t('customers.inbox.status.read') : t('customers.inbox.status.unread')
              }}
              hideActions={true}
              hideTitle={true}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>{t('common.actions.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default CustomerInbox
