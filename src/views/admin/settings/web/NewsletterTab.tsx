'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { SyntheticEvent } from 'react'
import {
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  TextField,
  Typography,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import SchemaTable from '@/components/schema/SchemaTable'
import type { ListSchema, SchemaAction } from '@/types/schema'
import { bfgApi, apiFetch } from '@/utils/api'

interface Subscription {
  id: number
  email: string
  status: string
  created_at: string
  updated_at: string
}

interface Template {
  id: number
  name: string
  subject_template: string
  body_html: string
  created_at: string
  updated_at: string
}

interface Send {
  id: number
  subject: string
  content: string
  template: number | null
  scheduled_at: string | null
  status: string
  sent_at: string | null
  created_at: string
  updated_at: string
}

interface SendLog {
  id: number
  newsletter_send: number
  newsletter_send_subject: string
  subscription: number
  email: string
  sent_at: string
  status: string
  error_message: string
}

function toResults<T>(data: { results?: T[] } | T[]): T[] {
  return Array.isArray(data) ? data : (data.results || [])
}

export default function NewsletterTab() {
  const t = useTranslations('admin.settings.web')
  const tCommon = useTranslations('admin.common')
  const [innerTab, setInnerTab] = useState('subscribers')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [sends, setSends] = useState<Send[]>([])
  const [sendLogs, setSendLogs] = useState<SendLog[]>([])
  const [loading, setLoading] = useState(false)
  const [addSubOpen, setAddSubOpen] = useState(false)
  const [addSubEmail, setAddSubEmail] = useState('')
  const [addSubSaving, setAddSubSaving] = useState(false)
  const [editSubOpen, setEditSubOpen] = useState(false)
  const [editSubRow, setEditSubRow] = useState<Subscription | null>(null)
  const [addSendOpen, setAddSendOpen] = useState(false)
  const [addSendSubject, setAddSendSubject] = useState('')
  const [addSendContent, setAddSendContent] = useState('')
  const [addSendTemplateId, setAddSendTemplateId] = useState<number | ''>('')
  const [addSendScheduledAt, setAddSendScheduledAt] = useState('')
  const [addSendSaving, setAddSendSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ results?: Subscription[] } | Subscription[]>(bfgApi.newsletterSubscriptions())
      setSubscriptions(toResults(data))
    } catch (e) {
      console.error(e)
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await apiFetch<{ results?: Template[] } | Template[]>(bfgApi.newsletterTemplates())
      setTemplates(toResults(data))
    } catch (e) {
      console.error(e)
      setTemplates([])
    }
  }, [])

  const fetchSends = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ results?: Send[] } | Send[]>(bfgApi.newsletterSends())
      setSends(toResults(data))
    } catch (e) {
      console.error(e)
      setSends([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSendLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ results?: SendLog[] } | SendLog[]>(bfgApi.newsletterSendLogs())
      setSendLogs(toResults(data))
    } catch (e) {
      console.error(e)
      setSendLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (innerTab === 'subscribers') fetchSubscriptions()
    else if (innerTab === 'templates') fetchTemplates()
    else if (innerTab === 'sends') fetchSends()
    else if (innerTab === 'sendLogs') fetchSendLogs()
  }, [innerTab, fetchSubscriptions, fetchTemplates, fetchSends, fetchSendLogs])

  useEffect(() => {
    if (addSendOpen) fetchTemplates()
  }, [addSendOpen, fetchTemplates])

  const handleInnerTabChange = (_e: SyntheticEvent, v: string) => setInnerTab(v)

  const handleAddSubscription = async () => {
    if (!addSubEmail.trim()) return
    setAddSubSaving(true)
    setError(null)
    try {
      await apiFetch(bfgApi.newsletterSubscriptions(), {
        method: 'POST',
        body: JSON.stringify({ email: addSubEmail.trim() }),
      })
      setAddSubEmail('')
      setAddSubOpen(false)
      fetchSubscriptions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add')
    } finally {
      setAddSubSaving(false)
    }
  }

  const handleUnsubscribe = async (id: number) => {
    try {
      await apiFetch(`${bfgApi.newsletterSubscriptions()}${id}/unsubscribe/`, { method: 'POST' })
      fetchSubscriptions()
      setEditSubOpen(false)
      setEditSubRow(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unsubscribe')
    }
  }

  const handleDeleteSubscription = async (id: number) => {
    try {
      await apiFetch(`${bfgApi.newsletterSubscriptions()}${id}/`, { method: 'DELETE' })
      fetchSubscriptions()
      setEditSubOpen(false)
      setEditSubRow(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const handleSendNow = async (id: number) => {
    try {
      await apiFetch(`${bfgApi.newsletterSends()}${id}/send-now/`, { method: 'POST' })
      fetchSends()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send')
    }
  }

  const handleCreateSend = async () => {
    if (!addSendSubject.trim()) return
    setAddSendSaving(true)
    setError(null)
    try {
      const body: { subject: string; content?: string; template?: number | null; scheduled_at?: string | null } = {
        subject: addSendSubject.trim(),
        content: addSendContent.trim() || undefined,
        template: addSendTemplateId === '' ? null : (addSendTemplateId as number),
        scheduled_at: addSendScheduledAt ? new Date(addSendScheduledAt).toISOString() : null,
      }
      await apiFetch(bfgApi.newsletterSends(), {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setAddSendSubject('')
      setAddSendContent('')
      setAddSendTemplateId('')
      setAddSendScheduledAt('')
      setAddSendOpen(false)
      fetchSends()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create send task')
    } finally {
      setAddSendSaving(false)
    }
  }

  const subscribersSchema: ListSchema = useMemo(
    () => ({
      title: t('page.tabs.newsletter'),
      columns: [
        { field: 'email', label: 'Email', type: 'string', sortable: true },
        { field: 'status', label: 'Status', type: 'select', sortable: true },
        { field: 'created_at', label: 'Created', type: 'datetime', sortable: true },
      ],
      searchFields: ['email'],
      filters: [
        {
          field: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: '', label: 'All' },
            { value: 'subscribed', label: 'Subscribed' },
            { value: 'unsubscribed', label: 'Unsubscribed' },
          ],
        },
      ],
      actions: [
        { id: 'add', label: 'Add subscriber', type: 'primary', scope: 'global', icon: 'tabler-plus' },
        { id: 'edit', label: 'Edit', type: 'secondary', scope: 'row' },
        { id: 'unsubscribe', label: 'Unsubscribe', type: 'secondary', scope: 'row', confirm: 'Unsubscribe this email?' },
        { id: 'delete', label: 'Delete', type: 'danger', scope: 'row', confirm: 'Delete this subscription?' },
      ],
    }),
    [t]
  )

  const sendsSchema: ListSchema = useMemo(
    () => ({
      title: t('page.tabs.newsletter'),
      columns: [
        { field: 'subject', label: 'Subject', type: 'string', sortable: true },
        { field: 'status', label: 'Status', type: 'select', sortable: true },
        { field: 'scheduled_at', label: 'Scheduled', type: 'datetime' },
        { field: 'sent_at', label: 'Sent', type: 'datetime' },
      ],
      filters: [
        {
          field: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: '', label: 'All' },
            { value: 'draft', label: 'Draft' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'sent', label: 'Sent' },
          ],
        },
      ],
      actions: [
        { id: 'add', label: 'Create send task', type: 'primary', scope: 'global', icon: 'tabler-plus' },
        { id: 'send_now', label: 'Send now', type: 'primary', scope: 'row', confirm: 'Send this newsletter now?' },
      ],
    }),
    [t]
  )

  const sendLogsSchema: ListSchema = useMemo(
    () => ({
      title: t('page.tabs.newsletter'),
      columns: [
        { field: 'newsletter_send_subject', label: 'Send', type: 'string' },
        { field: 'email', label: 'Email', type: 'string' },
        { field: 'status', label: 'Status', type: 'select' },
        { field: 'sent_at', label: 'Sent at', type: 'datetime' },
        { field: 'error_message', label: 'Error', type: 'string' },
      ],
    }),
    [t]
  )

  const templatesSchema: ListSchema = useMemo(
    () => ({
      title: t('page.tabs.newsletter'),
      columns: [
        { field: 'name', label: 'Name', type: 'string', sortable: true },
        { field: 'subject_template', label: 'Subject template', type: 'string' },
      ],
      searchFields: ['name', 'subject_template'],
    }),
    [t]
  )

  const subscriptionStatusColors = useMemo(
    () => ({ subscribed: 'success' as const, unsubscribed: 'default' as const }),
    []
  )
  const sendStatusColors = useMemo(
    () => ({
      draft: 'default' as const,
      scheduled: 'warning' as const,
      sending: 'info' as const,
      sent: 'success' as const,
      cancelled: 'default' as const,
    }),
    []
  )
  const sendLogStatusColors = useMemo(
    () => ({ success: 'success' as const, failed: 'error' as const }),
    []
  )

  const handleSubActionClick = async (action: SchemaAction, item: Subscription | Record<string, never>) => {
    if (action.id === 'add') {
      setAddSubOpen(true)
      return
    }
    if (action.id === 'edit' && 'id' in item) {
      setEditSubRow(item as Subscription)
      setEditSubOpen(true)
      return
    }
    if (action.id === 'unsubscribe' && 'id' in item) {
      await handleUnsubscribe((item as Subscription).id)
      return
    }
    if (action.id === 'delete' && 'id' in item) {
      await handleDeleteSubscription((item as Subscription).id)
    }
  }

  const handleSendActionClick = async (action: SchemaAction, item: Send | Record<string, never>) => {
    if (action.id === 'add') {
      setAddSendOpen(true)
      return
    }
    if (action.id === 'send_now' && 'id' in item) {
      await handleSendNow((item as Send).id)
    }
  }

  return (
    <CardContent>
      <Typography variant='h6' sx={{ mb: 2 }}>
        {t('page.tabs.newsletter')}
      </Typography>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Tabs value={innerTab} onChange={handleInnerTabChange} sx={{ mb: 2 }}>
        <Tab label='Subscribers' value='subscribers' />
        <Tab label='Send tasks' value='sends' />
        <Tab label='Send results' value='sendLogs' />
        <Tab label='Templates' value='templates' />
      </Tabs>

      {innerTab === 'subscribers' && (
        <SchemaTable<Subscription>
          schema={subscribersSchema}
          data={subscriptions}
          loading={loading}
          onActionClick={handleSubActionClick}
          statusColors={subscriptionStatusColors}
        />
      )}

      {innerTab === 'sends' && (
        <SchemaTable<Send>
          schema={sendsSchema}
          data={sends}
          loading={loading}
          onActionClick={handleSendActionClick}
          statusColors={sendStatusColors}
        />
      )}

      {innerTab === 'sendLogs' && (
        <SchemaTable<SendLog>
          schema={sendLogsSchema}
          data={sendLogs}
          loading={loading}
          statusColors={sendLogStatusColors}
        />
      )}

      {innerTab === 'templates' && (
        <SchemaTable<Template>
          schema={templatesSchema}
          data={templates}
          loading={loading}
        />
      )}

      <Dialog open={addSubOpen} onClose={() => setAddSubOpen(false)}>
        <DialogTitle>Add subscriber</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Email'
            type='email'
            fullWidth
            value={addSubEmail}
            onChange={(e) => setAddSubEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSubOpen(false)}>{tCommon('actions.cancel')}</Button>
          <Button onClick={handleAddSubscription} disabled={addSubSaving || !addSubEmail.trim()}>
            {addSubSaving ? tCommon('states.saving') : tCommon('actions.add')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editSubOpen} onClose={() => { setEditSubOpen(false); setEditSubRow(null) }}>
        <DialogTitle>Subscription</DialogTitle>
        <DialogContent>
          {editSubRow && (
            <Typography>
              {editSubRow.email} — {editSubRow.status}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSubOpen(false)}>{tCommon('actions.close')}</Button>
          {editSubRow && (
            <>
              {editSubRow.status === 'subscribed' && (
                <Button color='warning' onClick={() => handleUnsubscribe(editSubRow.id)}>
                  Unsubscribe
                </Button>
              )}
              <Button color='error' onClick={() => editSubRow && handleDeleteSubscription(editSubRow.id)}>
                {tCommon('actions.delete')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={addSendOpen} onClose={() => setAddSendOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Create send task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              label='Subject'
              required
              fullWidth
              value={addSendSubject}
              onChange={(e) => setAddSendSubject(e.target.value)}
            />
            <TextField
              label='Content (plain text or HTML)'
              placeholder='Plain text when no template; optional.'
              fullWidth
              multiline
              rows={4}
              value={addSendContent}
              onChange={(e) => setAddSendContent(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Template (optional)</InputLabel>
              <Select
                value={addSendTemplateId === '' ? '' : String(addSendTemplateId)}
                label='Template (optional)'
                onChange={(e) => {
                  const v = e.target.value
                  setAddSendTemplateId(v === '' ? '' : Number(v))
                }}
              >
                <MenuItem value=''>None</MenuItem>
                {templates.map((tmpl) => (
                  <MenuItem key={tmpl.id} value={String(tmpl.id)}>
                    {tmpl.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label='Scheduled at (optional)'
              type='datetime-local'
              fullWidth
              value={addSendScheduledAt}
              onChange={(e) => setAddSendScheduledAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSendOpen(false)}>{tCommon('actions.cancel')}</Button>
          <Button onClick={handleCreateSend} disabled={addSendSaving || !addSendSubject.trim()}>
            {addSendSaving ? tCommon('states.saving') : tCommon('actions.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </CardContent>
  )
}
