'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import CustomTextField from '@/components/ui/TextField'

import SchemaTable from '@/components/schema/SchemaTable'
import SchemaForm from '@/components/schema/SchemaForm'
import type { ListSchema, FormSchema, SchemaAction } from '@/types/schema'
import { useApiData } from '@/hooks/useApiData'
import {
  getTickets,
  getTicket,
  getTicketMessages,
  createTicket,
  updateTicket,
  deleteTicket,
  replyTicket,
  getSupportOptions,
  type SupportTicket,
  type SupportTicketPayload,
  type TicketMessage
} from '@/services/support'
import { buildTicketsSchema } from '@/data/supportSchemas'

export type TicketViewMode = 'unassigned' | 'my' | 'in_progress' | 'closed'

interface TicketsPageProps {
  viewMode?: TicketViewMode
}

export default function TicketsPage({ viewMode = 'unassigned' }: TicketsPageProps) {
  const t = useTranslations('admin')
  const [apiFilters, setApiFilters] = useState<Record<string, string>>({})

  useEffect(() => {
    if (viewMode === 'my') setApiFilters({ scope: 'my' })
    else if (viewMode === 'unassigned') setApiFilters({ scope: 'unassigned' })
    else if (viewMode === 'in_progress') setApiFilters({ status: 'in_progress' })
    else if (viewMode === 'closed') setApiFilters({ status: 'closed' })
    else setApiFilters({})
  }, [viewMode])

  const { data: optionsData } = useApiData({
    fetchFn: getSupportOptions
  })

  const fetchTicketsFn = useCallback(() => {
    const params = { ...apiFilters }
    if (viewMode === 'my') params.scope = 'my'
    else if (viewMode === 'unassigned') params.scope = 'unassigned'
    else if (viewMode === 'in_progress') params.status = 'in_progress'
    else if (viewMode === 'closed') params.status = 'closed'
    return getTickets(params)
  }, [apiFilters, viewMode])
  const { data: tickets, loading, error, refetch } = useApiData<SupportTicket[]>({
    fetchFn: fetchTicketsFn,
    deps: [apiFilters, viewMode]
  })

  const schema = useMemo(
    () => buildTicketsSchema(t, optionsData ?? null),
    [t, optionsData]
  )
  const listSchema = schema.list as ListSchema
  const formSchema = schema.form as FormSchema

  const [editItem, setEditItem] = useState<SupportTicket | Partial<SupportTicket> | null>(null)
  const [detailTab, setDetailTab] = useState(0)
  const [fetchingDetail, setFetchingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [extraMessages, setExtraMessages] = useState<TicketMessage[]>([])
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false)

  const handleActionClick = async (action: SchemaAction, item: SupportTicket | Record<string, never>) => {
    if (action.id === 'delete' && 'id' in item) {
      try {
        await deleteTicket(item.id)
        await refetch()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        alert(t('support.tickets.errors.deleteFailed', { error: msg }))
      }
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setFetchingDetail(true)
      setExtraMessages([])
      try {
        const full = await getTicket(item.id)
        setEditItem(full)
      } catch {
        alert(t('support.tickets.errors.loadFailed'))
      } finally {
        setFetchingDetail(false)
      }
      return
    }
    if (action.id === 'add') {
      setEditItem({ status: 'new', channel: 'web' })
    }
  }

  const formInitialData = useMemo(() => {
    if (!editItem) return undefined
    const ticket = editItem as SupportTicket
    const hasId = 'id' in editItem && typeof (editItem as SupportTicket).id === 'number'
    return {
      ticket_number: ticket.ticket_number ?? '',
      subject: ticket.subject ?? '',
      description: ticket.description ?? '',
      customer: ticket.customer ?? '',
      category: ticket.category ?? undefined,
      priority: ticket.priority ?? undefined,
      status: ticket.status ?? 'new',
      assigned_to: ticket.assigned_to ?? undefined,
      channel: ticket.channel ?? 'web',
      ...(hasId && ticket.created_at && { created_at: ticket.created_at }),
      ...(hasId && ticket.updated_at && { updated_at: ticket.updated_at })
    }
  }, [editItem])

  const handleSubmit = async (data: Record<string, unknown>) => {
    const hasId = editItem && 'id' in editItem && typeof (editItem as SupportTicket).id === 'number'
    const payload: SupportTicketPayload = {
      subject: String(data.subject ?? ''),
      description: String(data.description ?? ''),
      customer: Number(data.customer),
      category: data.category != null && data.category !== '' ? Number(data.category) : null,
      priority: data.priority != null && data.priority !== '' ? Number(data.priority) : null,
      status: String(data.status ?? 'new'),
      assigned_to: data.assigned_to != null && data.assigned_to !== '' ? Number(data.assigned_to) : null,
      channel: data.channel ? String(data.channel) : 'web'
    }

    setSaving(true)
    try {
      if (hasId) {
        await updateTicket((editItem as SupportTicket).id, payload)
      } else {
        await createTicket(payload)
      }
      await refetch()
      setEditItem(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(t('support.tickets.errors.saveFailed', { error: msg }))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditItem(null)
    setDetailTab(0)
    setReplyMessage('')
    setExtraMessages([])
  }

  const isExistingTicket = editItem && 'id' in editItem && typeof (editItem as SupportTicket).id === 'number'
  const ticketWithMessages = isExistingTicket ? (editItem as SupportTicket) : null
  const initialMessages = ticketWithMessages?.messages ?? []
  const displayedMessages = initialMessages.concat(extraMessages)
  const messagesCount = ticketWithMessages?.messages_count ?? 0
  const hasMoreMessages = displayedMessages.length < messagesCount
  const assignments = ticketWithMessages?.assignments ?? []

  const handleLoadMoreMessages = useCallback(async () => {
    if (!ticketWithMessages?.id || loadingMoreMessages || !hasMoreMessages) return
    setLoadingMoreMessages(true)
    try {
      const nextPage = Math.floor(displayedMessages.length / 10) + 1
      const data = await getTicketMessages(ticketWithMessages.id, nextPage, 10)
      setExtraMessages((prev) => prev.concat(data.results))
    } finally {
      setLoadingMoreMessages(false)
    }
  }, [ticketWithMessages?.id, loadingMoreMessages, hasMoreMessages, displayedMessages.length])

  const handleReplySubmit = async () => {
    if (!ticketWithMessages || !replyMessage.trim()) return
    setReplySubmitting(true)
    try {
      const updated = await replyTicket(ticketWithMessages.id, { message: replyMessage.trim() })
      setEditItem(updated)
      setExtraMessages([])
      setReplyMessage('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(t('support.tickets.errors.replyFailed', { error: msg }))
    } finally {
      setReplySubmitting(false)
    }
  }

  const formatMsgTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    } catch {
      return dateStr
    }
  }

  if (loading && !tickets?.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  const pageTitle =
    viewMode === 'my'
      ? t('support.tickets.page.titleMy')
      : viewMode === 'unassigned'
        ? t('support.tickets.page.titleUnprocessed')
        : viewMode === 'in_progress'
          ? t('support.tickets.page.titleInProgress')
          : viewMode === 'closed'
            ? t('support.tickets.page.titleClosed')
            : t('support.tickets.page.title')

  return (
    <Box>
      <Typography variant='h4' sx={{ mb: 4 }}>
        {pageTitle}
      </Typography>
      <SchemaTable
        schema={listSchema}
        data={tickets ?? []}
        loading={loading}
        onActionClick={handleActionClick}
        fetchDetailFn={(id) => getTicket(typeof id === 'string' ? parseInt(id, 10) : id)}
        filters={apiFilters}
        onFiltersChange={setApiFilters}
      />

      {fetchingDetail && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {editItem !== null && !fetchingDetail && formSchema && (
        <Dialog open onClose={handleCancel} maxWidth='md' fullWidth>
          <DialogContent
            sx={{
              p: 0,
              '& .MuiCard-root': { boxShadow: 'none' },
              '& .MuiCardContent-root': { p: 4 }
            }}
          >
            {isExistingTicket ? (
              <>
                <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ px: 2, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label={t('support.tickets.tabs.basic')} />
                  <Tab label={t('support.tickets.tabs.replies')} />
                  <Tab label={t('support.tickets.tabs.assignments')} />
                </Tabs>
                <Box sx={{ p: 4 }}>
                  {detailTab === 0 && (
                    <SchemaForm
                      schema={formSchema}
                      initialData={formInitialData}
                      onSubmit={handleSubmit}
                      onCancel={handleCancel}
                      loading={saving}
                    />
                  )}
                  {detailTab === 1 && (
                    <Box>
                      <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
                        {t('support.tickets.conversation.title')}
                      </Typography>
                      {displayedMessages.length === 0 ? (
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                          {t('support.tickets.conversation.noMessages')}
                        </Typography>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2, maxHeight: 280, overflow: 'auto' }}>
                            {displayedMessages.map((msg) => (
                              <Box
                                key={msg.id}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  bgcolor: (theme) =>
                                    theme.palette.mode === 'dark'
                                      ? theme.palette.background.paper
                                      : msg.is_staff_reply
                                        ? 'action.hover'
                                        : 'grey.50',
                                  border: (theme) => `1px solid ${theme.palette.divider}`
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant='caption' fontWeight={600}>
                                    {msg.is_staff_reply ? (msg.sender_name || t('support.tickets.conversation.staff')) : t('support.tickets.conversation.customer')}
                                    {msg.is_internal && ` (${t('support.tickets.conversation.internal')})`}
                                  </Typography>
                                  <Typography variant='caption' color='text.secondary'>
                                    {formatMsgTime(msg.created_at)}
                                  </Typography>
                                </Box>
                                <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                                  {msg.message}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                          {hasMoreMessages && (
                            <Button
                              size='small'
                              onClick={handleLoadMoreMessages}
                              disabled={loadingMoreMessages}
                              sx={{ mb: 2 }}
                            >
                              {loadingMoreMessages ? t('support.tickets.conversation.loadingMore') : t('support.tickets.conversation.loadMore')}
                            </Button>
                          )}
                        </>
                      )}
                      <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 1 }}>
                        {t('support.tickets.conversation.addReply')}
                      </Typography>
                      <CustomTextField
                        fullWidth
                        multiline
                        rows={3}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder={t('support.tickets.conversation.replyPlaceholder')}
                        sx={{ mb: 1.5 }}
                      />
                      <Button
                        variant='contained'
                        onClick={handleReplySubmit}
                        disabled={replySubmitting || !replyMessage.trim()}
                      >
                        {replySubmitting ? t('support.tickets.conversation.submitting') : t('support.tickets.conversation.submit')}
                      </Button>
                    </Box>
                  )}
                  {detailTab === 2 && (
                    <Box>
                      <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
                        {t('support.tickets.assignments.title')}
                      </Typography>
                      {assignments.length === 0 ? (
                        <Typography variant='body2' color='text.secondary'>
                          {t('support.tickets.assignments.noRecords')}
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 320, overflow: 'auto' }}>
                          {assignments.map((a) => (
                            <Box
                              key={a.id}
                              sx={{
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: (theme) =>
                                  theme.palette.mode === 'dark' ? theme.palette.background.paper : 'grey.50',
                                color: 'text.primary',
                                border: (theme) => `1px solid ${theme.palette.divider}`
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                                <Typography variant='body2' color='text.primary'>
                                  {(a.assigned_from_name ?? '—')} → {a.assigned_to_name ?? '—'}
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {formatMsgTime(a.assigned_at)}
                                </Typography>
                              </Box>
                              {a.assigned_by_name && (
                                <Typography variant='caption' color='text.secondary'>
                                  {t('support.tickets.assignments.by')}: {a.assigned_by_name}
                                </Typography>
                              )}
                              {a.reason && (
                                <Typography variant='body2' sx={{ mt: 0.5 }} color='text.primary'>
                                  {a.reason}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <Box sx={{ p: 4 }}>
                <SchemaForm
                  schema={formSchema}
                  initialData={formInitialData}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  loading={saving}
                />
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  )
}
