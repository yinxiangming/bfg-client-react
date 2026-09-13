'use client'

// React Imports
import { useCallback, useEffect, useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import Icon from '@components/Icon'
import CustomTextField from '@components/ui/TextField'
import StatusBadge from '@/components/schema/StatusBadge'
import { AccountCard, AccountEmpty, AccountLoading, formatDayTime, formatShortDay } from '@/components/account/AccountUI'

// Utils Imports
import { useAccount } from '@/contexts/AccountContext'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { meApi } from '@/utils/meApi'
import { listOf } from '@/views/account/shared/api'
import type { BadgeTone } from '@/views/account/shared/orders'

type Ticket = {
  id: number
  ticket_number: string
  subject: string
  description?: string
  status: string
  created_at?: string
  updated_at?: string
}

type TicketMessage = {
  id: number
  message: string
  is_staff_reply: boolean
  is_internal?: boolean
  created_at: string
}

type TicketDetail = Ticket & { messages?: TicketMessage[] }

type SupportOptions = {
  ticket_priorities: { value: number; label: string }[]
  ticket_categories: { value: number; label: string }[]
  support_notice?: string
}

type Draft = {
  subject: string
  description: string
  category: number | ''
  priority: number | ''
}

const EMPTY_DRAFT: Draft = { subject: '', description: '', category: '', priority: '' }

/** Statuses after which the shop has nothing left to do. */
const CLOSED = ['resolved', 'closed']

const STATUS_TONE: Record<string, BadgeTone> = {
  new: 'info',
  open: 'info',
  pending: 'warning',
  on_hold: 'default',
  resolved: 'success',
  closed: 'default'
}

const STATUS_LABEL: Record<string, string> = {
  new: 'statusNew',
  open: 'statusOpen',
  pending: 'statusPending',
  on_hold: 'statusOnHold',
  resolved: 'statusResolved',
  closed: 'statusClosed'
}

const HELP_LINKS = [
  { key: 'order', href: '/account/orders', icon: 'tabler-truck-delivery' },
  { key: 'returns', href: '/account/returns', icon: 'tabler-arrow-back-up' },
  { key: 'payments', href: '/account/payments', icon: 'tabler-file-invoice' }
] as const

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?'

const Support = () => {
  const t = useTranslations('account')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const config = useStorefrontConfigSafe()
  const { user } = useAccount()

  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [options, setOptions] = useState<SupportOptions | null>(null)
  const [tab, setTab] = useState<'open' | 'closed'>('open')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<TicketDetail | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadTickets = useCallback(async () => {
    try {
      const rows = listOf<Ticket>(await meApi.getTickets({ page_size: 50 }))

      setTickets(rows)

      return rows
    } catch (err) {
      setTickets([])
      setError(err instanceof Error ? err.message : t('support.failedLoad'))

      return []
    }
  }, [t])

  useEffect(() => {
    loadTickets().then(rows => {
      if (rows.length > 0 && rows.every(row => CLOSED.includes(row.status))) setTab('closed')
    })
    meApi
      .getSupportOptions()
      .then(setOptions)
      .catch(() => setOptions(null))
  }, [loadTickets])

  // Links from an order ("Get help", "Report a delivery problem") open a ticket about it.
  useEffect(() => {
    const order = searchParams.get('order')
    const topic = searchParams.get('topic')

    if (!order && !topic && searchParams.get('new') !== '1') return

    const subject =
      topic === 'delivery' && order
        ? t('support.prefill.delivery', { order })
        : topic === 'data'
          ? t('support.prefill.data')
          : order
            ? t('support.prefill.order', { order })
            : ''

    setDraft({ ...EMPTY_DRAFT, subject })
    // Drop the parameters so a refresh does not open the form again.
    router.replace(pathname, { scroll: false })
  }, [searchParams, pathname, router, t])

  const openTickets = useMemo(() => (tickets ?? []).filter(ticket => !CLOSED.includes(ticket.status)), [tickets])
  const closedTickets = useMemo(() => (tickets ?? []).filter(ticket => CLOSED.includes(ticket.status)), [tickets])
  const visible = tab === 'open' ? openTickets : closedTickets
  const selected = visible.find(ticket => ticket.id === selectedId) ?? null

  // Always show a conversation: the first ticket in the tab when none of its tickets is picked.
  useEffect(() => {
    if (!tickets || visible.some(ticket => ticket.id === selectedId)) return

    setSelectedId(visible[0]?.id ?? null)
  }, [tickets, visible, selectedId])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)

      return
    }

    let cancelled = false

    setDetail(null)
    meApi
      .getTicket(selectedId)
      .then(data => {
        if (!cancelled) setDetail(data)
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('support.failedLoad'))
      })

    return () => {
      cancelled = true
    }
  }, [selectedId, t])

  const submit = async () => {
    if (!draft || !draft.subject.trim() || !draft.description.trim()) return

    setSubmitting(true)

    try {
      await meApi.createTicket({
        subject: draft.subject.trim(),
        description: draft.description.trim(),
        category: draft.category === '' ? undefined : draft.category,
        priority: draft.priority === '' ? undefined : draft.priority
      })
      setDraft(null)
      setNotice(t('support.created'))
      setTab('open')

      const rows = await loadTickets()

      setSelectedId(rows.find(row => !CLOSED.includes(row.status))?.id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('support.failedCreate'))
    } finally {
      setSubmitting(false)
    }
  }

  const statusLabel = (status: string) => (STATUS_LABEL[status] ? t(`support.${STATUS_LABEL[status]}`) : status)
  const customerName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || t('support.you')
  const staffName = config.site_name || t('support.supportTeam')
  const contactEmail = config.support_email || config.contact_email

  // The ticket's own description opens the conversation. Internal notes are the shop's and
  // never shown, whatever the API sends.
  const thread = detail
    ? [
        ...(detail.description
          ? [{ key: 'description', staff: false, body: detail.description, time: detail.created_at }]
          : []),
        ...(detail.messages ?? [])
          .filter(message => !message.is_internal)
          .map(message => ({
            key: `message-${message.id}`,
            staff: message.is_staff_reply,
            body: message.message,
            time: message.created_at
          }))
      ]
    : []

  return (
    <>
      {options?.support_notice && (
        <Alert severity='info' className='acc-pre'>
          {options.support_notice}
        </Alert>
      )}
      {notice && (
        <Alert severity='success' onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className='acc-grid'>
        <div className='acc-col'>
          <AccountCard>
            <div className='acc-tabs' role='tablist'>
              {(['open', 'closed'] as const).map(key => {
                const count = (key === 'open' ? openTickets : closedTickets).length

                return (
                  <button
                    key={key}
                    type='button'
                    role='tab'
                    className='acc-tab'
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                  >
                    {t(`support.tabs.${key}`)}
                    {count > 0 && <span className='acc-count'>{count}</span>}
                  </button>
                )
              })}
            </div>

            {tickets === null ? (
              <AccountLoading />
            ) : visible.length === 0 ? (
              <AccountEmpty
                icon='tabler-message-circle'
                title={tab === 'open' ? t('support.noOpenTickets') : t('support.noClosedTickets')}
                action={
                  tab === 'open' ? (
                    <Button size='small' variant='contained' onClick={() => setDraft({ ...EMPTY_DRAFT })}>
                      {t('support.newTicket')}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              visible.map(ticket => (
                <button
                  key={ticket.id}
                  type='button'
                  className={ticket.id === selectedId ? 'acc-row acc-row--selected' : 'acc-row'}
                  aria-pressed={ticket.id === selectedId}
                  onClick={() => setSelectedId(ticket.id)}
                >
                  <div className='acc-grow'>
                    <div className='acc-strong acc-truncate'>{ticket.subject}</div>
                    <div className='acc-sub acc-truncate'>{ticket.ticket_number}</div>
                  </div>
                  <div className='acc-meta'>
                    <StatusBadge label={statusLabel(ticket.status)} color={STATUS_TONE[ticket.status] ?? 'default'} />
                    <span className='acc-sub'>
                      {t('support.updated', { date: formatShortDay(ticket.updated_at || ticket.created_at) })}
                    </span>
                  </div>
                  <Icon icon='tabler-chevron-right' className='acc-chev' />
                </button>
              ))
            )}
          </AccountCard>

          {selected && (
            <AccountCard
              title={selected.subject}
              subtitle={selected.ticket_number}
              action={<StatusBadge label={statusLabel(selected.status)} color={STATUS_TONE[selected.status] ?? 'default'} />}
            >
              {!detail ? (
                <AccountLoading />
              ) : (
                <>
                  <div className='acc-thread'>
                    {thread.map(entry => {
                      const name = entry.staff ? staffName : customerName

                      return (
                        <div key={entry.key} className='acc-msg'>
                          <span className={entry.staff ? 'acc-msg-avatar acc-msg-avatar--staff' : 'acc-msg-avatar'}>
                            {initials(name)}
                          </span>
                          <div className='acc-grow'>
                            <div className='acc-msg-head'>
                              <span className='acc-strong'>{name}</span>
                              <span className='acc-sub'>{formatDayTime(entry.time)}</span>
                            </div>
                            <div className='acc-msg-bubble'>{entry.body}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {!CLOSED.includes(detail.status) && (
                    <div className='acc-card-foot'>
                      <span className='acc-sub'>{t('support.replyHint', { number: detail.ticket_number })}</span>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() =>
                          setDraft({
                            ...EMPTY_DRAFT,
                            subject: t('support.followUpSubject', { number: detail.ticket_number, subject: detail.subject })
                          })
                        }
                      >
                        {t('support.followUp')}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </AccountCard>
          )}
        </div>

        <div className='acc-col'>
          <AccountCard title={t('support.help.title')}>
            {HELP_LINKS.map(link => (
              <Link key={link.key} href={link.href} className='acc-row'>
                <Icon icon={link.icon} className='acc-lead' />
                <span className='acc-grow acc-medium'>{t(`support.help.${link.key}`)}</span>
                <Icon icon='tabler-chevron-right' className='acc-chev' />
              </Link>
            ))}
            <button type='button' className='acc-row' onClick={() => setDraft({ ...EMPTY_DRAFT })}>
              <Icon icon='tabler-message-circle' className='acc-lead' />
              <span className='acc-grow acc-medium'>{t('support.help.other')}</span>
              <Icon icon='tabler-chevron-right' className='acc-chev' />
            </button>
          </AccountCard>

          {(contactEmail || config.contact_phone) && (
            <AccountCard title={t('support.contact.title')}>
              {contactEmail && (
                <div className='acc-row acc-row--top'>
                  <span className='acc-ico acc-ico--sm acc-ico--neu'>
                    <Icon icon='tabler-mail' />
                  </span>
                  <div className='acc-grow'>
                    <a href={`mailto:${contactEmail}`} className='acc-link'>
                      {contactEmail}
                    </a>
                    <div className='acc-sub'>{t('support.contact.emailHint')}</div>
                  </div>
                </div>
              )}
              {config.contact_phone && (
                <div className='acc-row'>
                  <span className='acc-ico acc-ico--sm acc-ico--neu'>
                    <Icon icon='tabler-phone' />
                  </span>
                  <a href={`tel:${config.contact_phone.replace(/\s+/g, '')}`} className='acc-link'>
                    {config.contact_phone}
                  </a>
                </div>
              )}
            </AccountCard>
          )}
        </div>
      </div>

      <Dialog open={Boolean(draft)} onClose={() => !submitting && setDraft(null)} maxWidth='sm' fullWidth>
        <DialogTitle>{t('support.newTicket')}</DialogTitle>
        <DialogContent>
          {draft && (
            <div className='acc-stack acc-dialog-fields'>
              <CustomTextField
                autoFocus
                required
                fullWidth
                label={t('support.subject')}
                placeholder={t('support.subjectPlaceholder')}
                value={draft.subject}
                onChange={event => {
                  const subject = event.target.value

                  setDraft(current => current && { ...current, subject })
                }}
              />
              <CustomTextField
                required
                fullWidth
                multiline
                minRows={4}
                label={t('support.description')}
                placeholder={t('support.descriptionPlaceholder')}
                value={draft.description}
                onChange={event => {
                  const description = event.target.value

                  setDraft(current => current && { ...current, description })
                }}
              />
              {options && options.ticket_categories?.length > 0 && (
                <CustomTextField
                  select
                  fullWidth
                  label={t('support.category')}
                  value={draft.category}
                  onChange={event => {
                    const category = event.target.value === '' ? '' : Number(event.target.value)

                    setDraft(current => current && { ...current, category })
                  }}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value=''>{t('support.categoryOptional')}</MenuItem>
                  {options.ticket_categories.map(category => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
              {options && options.ticket_priorities?.length > 0 && (
                <CustomTextField
                  select
                  fullWidth
                  label={t('support.priority')}
                  value={draft.priority}
                  onChange={event => {
                    const priority = event.target.value === '' ? '' : Number(event.target.value)

                    setDraft(current => current && { ...current, priority })
                  }}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value=''>{t('support.priorityOptional')}</MenuItem>
                  {options.ticket_priorities.map(priority => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </CustomTextField>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDraft(null)} disabled={submitting}>
            {t('support.cancel')}
          </Button>
          <Button
            variant='contained'
            onClick={submit}
            disabled={submitting || !draft?.subject.trim() || !draft?.description.trim()}
          >
            {submitting ? t('support.submitting') : t('support.submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Support
