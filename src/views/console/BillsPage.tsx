'use client'

/**
 * Every invoice raised against the workspaces the account owns, on one page.
 *
 * Invoices are asked for per workspace, so the page asks for all of them at once and
 * waits for the lot: one workspace the server cannot answer for is named on its own line
 * rather than taken as a failure of the page, because someone who runs six shops should
 * still see the other five's bills. Ownership is what decides the list — a workspace the
 * account merely works in is billed to whoever owns it, not to this reader.
 *
 * Anything still owed can be settled from its own row. What that takes depends on the
 * gateway the server picks, which is why the dialog rather than this page decides what to
 * put in front of the payer — see `PayBillDialog`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import Icon from '@components/Icon'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import StatusBadge from '@/components/schema/StatusBadge'
import { useConsole } from '@/contexts/ConsoleContext'
import {
  formatMoney,
  getConsoleErrorCode,
  invoiceState,
  listWorkspaceInvoices,
  payWorkspaceInvoice,
  type ConsoleInvoice,
  type ConsoleInvoiceState
} from '@/services/console'

import { formatDay, formatPeriod } from './billingPeriods'
import PayBillDialog, { type PayAttempt } from './PayBillDialog'
import { refusalMessage } from './refusal'

const STATE_COLOR: Record<ConsoleInvoiceState, 'success' | 'error' | 'warning'> = {
  paid: 'success',
  overdue: 'error',
  unpaid: 'warning'
}

/** One invoice under the name of the workspace it bills for. */
type BillRow = { workspaceId: number; workspaceName: string; invoice: ConsoleInvoice }

type BillsState =
  | { kind: 'loading' }
  | { kind: 'loaded'; rows: BillRow[]; failed: string[] }

/** The bill being settled, and how far asking to settle it has got. */
type Paying = { row: BillRow; attempt: PayAttempt }

export default function BillsPage() {
  const t = useTranslations('admin.console.bills')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const { state: consoleState } = useConsole()
  const [state, setState] = useState<BillsState>({ kind: 'loading' })
  const [expanded, setExpanded] = useState<string | null>(null)
  const [paying, setPaying] = useState<Paying | null>(null)
  const currentRequest = useRef(0)

  // Memoised on the console's own state, so the invoices are fetched again only when the
  // set of workspaces really changes — not on every render of this page.
  const owned = useMemo(
    () => (consoleState.kind === 'loaded' ? consoleState.workspaces.filter(workspace => workspace.is_owner) : []),
    [consoleState]
  )

  const load = useCallback(async () => {
    const request = currentRequest.current + 1

    currentRequest.current = request
    setState({ kind: 'loading' })

    if (owned.length === 0) {
      setState({ kind: 'loaded', rows: [], failed: [] })

      return
    }

    const answers = await Promise.allSettled(owned.map(workspace => listWorkspaceInvoices(workspace.id)))

    // The account may have switched workspaces, or reloaded the console, while these were
    // in the air; one set of invoices under another account's names would be nonsense.
    if (currentRequest.current !== request) return

    const rows: BillRow[] = []
    const failed: string[] = []

    answers.forEach((answer, index) => {
      const workspace = owned[index]

      if (answer.status !== 'fulfilled') {
        failed.push(workspace.name)

        return
      }

      for (const invoice of answer.value) {
        rows.push({ workspaceId: workspace.id, workspaceName: workspace.name, invoice })
      }
    })

    setState({ kind: 'loaded', rows, failed })
  }, [owned])

  /**
   * Ask the server to open a payment, and hand whatever it answers to the dialog.
   *
   * It is the click that sends this and not the dialog opening: a payment is a record the
   * server writes, and an effect firing twice — which React does on purpose in
   * development — would write two and have the second refused as one already in progress.
   */
  const startPayment = useCallback(
    async (row: BillRow) => {
      setPaying({ row, attempt: { kind: 'opening' } })

      try {
        const result = await payWorkspaceInvoice(row.workspaceId, row.invoice.number)

        setPaying({ row, attempt: { kind: 'opened', result } })
      } catch (error) {
        const message = refusalMessage(error, t('pay.failed'), code =>
          t.has(`errors.${code}`) ? t(`errors.${code}`) : null
        )

        setPaying({
          row,
          attempt: {
            kind: 'refused',
            message,
            // A refusal the server put a name to will be the same refusal next time, and
            // several of them say as much. Only one it could not name — a connection that
            // dropped on the way — is worth asking for again.
            retryable: getConsoleErrorCode(error) === null
          }
        })
      }

      // Either way the bill may not be what this page last read: opening a payment can
      // mark it in progress, and a refusal is often a bill someone else has settled.
      void load()
    },
    [load, t]
  )

  useEffect(() => {
    void load()

    // An answer for a list the page has left behind is no longer anyone's.
    return () => {
      currentRequest.current += 1
    }
  }, [load])

  // Newest period first, and one workspace's invoices kept together within a period.
  // Ordering is how the page reads, not part of fetching it, so changing language
  // reorders what is already here instead of asking for it all again.
  const rows = useMemo(() => {
    if (state.kind !== 'loaded') return []

    return [...state.rows].sort(
      (left, right) =>
        right.invoice.period.localeCompare(left.invoice.period) ||
        left.workspaceName.localeCompare(right.workspaceName, locale)
    )
  }, [state, locale])

  if (consoleState.kind === 'loading') {
    return (
      <Card sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={28} aria-label={t('loading')} />
      </Card>
    )
  }

  if (consoleState.kind === 'failed') {
    return <Alert severity='error'>{t('loadFailed')}</Alert>
  }

  const failed = state.kind === 'loaded' ? state.failed : []
  const overdueCount = rows.filter(row => invoiceState(row.invoice) === 'overdue').length

  const cellSx = { fontSize: 13, color: 'var(--at-row-fg)', whiteSpace: 'nowrap' as const }
  const mutedSx = { color: 'var(--at-row-sub)' }

  return (
    <>
      <AdminPageHeader title={t('title')} subtitle={t('subtitle')} />

      {overdueCount > 0 && (
        <Alert severity='error' sx={{ mb: 4 }}>
          <AlertTitle>{t('overdue.title', { count: overdueCount })}</AlertTitle>
          {t('overdue.body')}
        </Alert>
      )}

      {failed.length > 0 && (
        <Alert
          severity='warning'
          sx={{ mb: 4 }}
          action={
            <Button color='inherit' size='small' onClick={() => void load()}>
              {tActions('retry')}
            </Button>
          }
        >
          {t('partial', { names: failed.join(locale.startsWith('zh') ? '、' : ', ') })}
        </Alert>
      )}

      <Card>
        {state.kind === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress size={28} aria-label={t('loading')} />
          </Box>
        )}

        {state.kind === 'loaded' && rows.length === 0 && (
          <Box sx={{ px: 6, py: 10, textAlign: 'center', ...mutedSx }}>
            {owned.length === 0 ? t('noWorkspaces') : failed.length > 0 ? t('noneLoaded') : t('empty')}
          </Box>
        )}

        {rows.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 48 }} />
                  <TableCell>{t('columns.workspace')}</TableCell>
                  <TableCell>{t('columns.period')}</TableCell>
                  <TableCell>{t('columns.issued')}</TableCell>
                  <TableCell>{t('columns.due')}</TableCell>
                  <TableCell align='right'>{t('columns.total')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align='right' />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => {
                  const { invoice } = row
                  const key = `${row.workspaceId}:${invoice.id}`
                  const open = expanded === key
                  const status = invoiceState(invoice)

                  return [
                    <TableRow key={key} hover>
                      <TableCell>
                        <IconButton
                          size='small'
                          aria-label={open ? t('collapse') : t('expand')}
                          aria-expanded={open}
                          aria-controls={`invoice-lines-${key}`}
                          onClick={() => setExpanded(open ? null : key)}
                        >
                          <Icon icon={open ? 'tabler-chevron-down' : 'tabler-chevron-right'} />
                        </IconButton>
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Link href={`/workspaces/${row.workspaceId}/usage?month=${invoice.period}`}>
                          {row.workspaceName}
                        </Link>
                      </TableCell>
                      <TableCell sx={cellSx}>{formatPeriod(invoice.period, locale)}</TableCell>
                      <TableCell sx={cellSx}>{formatDay(invoice.issue_date, locale)}</TableCell>
                      <TableCell sx={cellSx}>{formatDay(invoice.due_date, locale)}</TableCell>
                      <TableCell align='right' sx={cellSx}>
                        {formatMoney(invoice.total, invoice.currency)}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <StatusBadge label={t(`status.${status}`)} color={STATE_COLOR[status]} />
                      </TableCell>
                      <TableCell align='right' sx={cellSx}>
                        {/* Nothing is offered against a bill that is already settled. A
                            suspended or deactivated workspace still gets the button:
                            being unable to trade is the likeliest reason to be here. */}
                        {status !== 'paid' && (
                          <Button
                            size='small'
                            variant='outlined'
                            // Every row's button says "Pay", so the accessible name has to
                            // carry the invoice it pays.
                            aria-label={t('pay.title', { number: invoice.number })}
                            onClick={() => void startPayment(row)}
                          >
                            {tActions('pay')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>,
                    <TableRow key={`${key}-lines`}>
                      <TableCell colSpan={8} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
                        <Collapse id={`invoice-lines-${key}`} in={open} unmountOnExit timeout='auto'>
                          <Box sx={{ py: 4 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'baseline',
                                gap: 3,
                                mb: 2,
                                fontSize: 13
                              }}
                            >
                              <Typography component='h3' sx={{ fontSize: 13, fontWeight: 600 }}>
                                {t('number', { number: invoice.number })}
                              </Typography>
                              {invoice.paid_date && (
                                <Typography variant='caption' sx={mutedSx}>
                                  {t('paidOn', { date: formatDay(invoice.paid_date, locale) })}
                                </Typography>
                              )}
                            </Box>

                            {invoice.items.length === 0 ? (
                              <Box sx={{ fontSize: 13, ...mutedSx }}>{t('noLines')}</Box>
                            ) : (
                              <Box sx={{ overflowX: 'auto' }}>
                                <Table size='small'>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>{t('lines.description')}</TableCell>
                                      <TableCell align='right'>{t('lines.quantity')}</TableCell>
                                      <TableCell align='right'>{t('lines.unitPrice')}</TableCell>
                                      <TableCell align='right'>{t('lines.subtotal')}</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {invoice.items.map((item, index) => (
                                      <TableRow key={`${item.description}-${index}`}>
                                        <TableCell sx={{ ...cellSx, whiteSpace: 'normal' }}>
                                          {item.description}
                                        </TableCell>
                                        <TableCell align='right' sx={cellSx}>
                                          {item.quantity}
                                        </TableCell>
                                        <TableCell align='right' sx={cellSx}>
                                          {formatMoney(item.unit_price, invoice.currency)}
                                        </TableCell>
                                        <TableCell align='right' sx={cellSx}>
                                          {formatMoney(item.subtotal, invoice.currency)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            )}

                            <Box
                              sx={{
                                mt: 3,
                                display: 'grid',
                                justifyContent: { sm: 'end' },
                                gap: 1,
                                fontSize: 13,
                                color: 'var(--at-row-fg)'
                              }}
                            >
                              <Box sx={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                                <Box sx={mutedSx}>{t('subtotal')}</Box>
                                <Box>{formatMoney(invoice.subtotal, invoice.currency)}</Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                                <Box sx={mutedSx}>{t('tax')}</Box>
                                <Box>{formatMoney(invoice.tax, invoice.currency)}</Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 6, justifyContent: 'space-between', fontWeight: 600 }}>
                                <Box>{t('total')}</Box>
                                <Box>{formatMoney(invoice.total, invoice.currency)}</Box>
                              </Box>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  ]
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {paying && (
        <PayBillDialog
          open
          workspaceName={paying.row.workspaceName}
          invoice={paying.row.invoice}
          attempt={paying.attempt}
          onRetry={() => void startPayment(paying.row)}
          onClose={() => setPaying(null)}
          onConfirmed={() => void load()}
        />
      )}
    </>
  )
}
