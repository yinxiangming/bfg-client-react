'use client'

/** Read-only history of sensitive Platform control-plane operations. */

import { useCallback, useEffect, useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { listConsoleAuditEvents, type ConsoleAuditEvent } from '@/services/consoleAdmin'

import { usePlatformAdmin } from '../usePlatformAdmin'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; events: ConsoleAuditEvent[]; next: string | null }

type AuditFilters = { action: string; targetType: string; targetId: string }

const EMPTY_FILTERS: AuditFilters = { action: '', targetType: '', targetId: '' }

function snapshot(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2)
}

export default function AuditLogPage() {
  const t = useTranslations('admin.console.audit')
  const locale = useLocale()
  const { ready, failed, isPlatformAdmin, capabilities } = usePlatformAdmin()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(EMPTY_FILTERS)
  const [loadingMore, setLoadingMore] = useState(false)
  const [detail, setDetail] = useState<ConsoleAuditEvent | null>(null)

  const load = useCallback(async (next?: string, append = false) => {
    if (append) setLoadingMore(true)
    else setState({ kind: 'loading' })
    try {
      const page = await listConsoleAuditEvents({
        action: appliedFilters.action,
        targetType: appliedFilters.targetType,
        targetId: appliedFilters.targetId,
        cursor: next,
        limit: 50
      })
      setState(previous => ({
        kind: 'loaded',
        events: append && previous.kind === 'loaded' ? [...previous.events, ...page.results] : page.results,
        next: page.next
      }))
    } catch {
      if (!append) setState({ kind: 'failed' })
    } finally {
      setLoadingMore(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    if (isPlatformAdmin && capabilities.audit_log) void load()
  }, [capabilities.audit_log, isPlatformAdmin, load])

  const apply = () => setAppliedFilters(filters)
  const clear = () => {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  if (failed) return <Alert severity='error'>{t('loadFailed')}</Alert>
  if (!ready) return <Card sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={28} aria-label={t('loading')} /></Card>
  if (!isPlatformAdmin) return <Alert severity='info'>{t('forbidden')}</Alert>
  if (!capabilities.audit_log) return <Alert severity='info'>{t('unavailable')}</Alert>

  const cellSx = { fontSize: 13, color: 'var(--at-row-fg)', verticalAlign: 'top' }
  const mutedSx = { color: 'var(--at-row-sub)' }
  const resultLabel = (result: string) => (t.has(`results.${result}`) ? t(`results.${result}`) : result)

  return (
    <>
      <AdminPageHeader title={t('title')} subtitle={t('subtitle')} />

      <Card sx={{ mb: 6 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr)) auto auto' }, gap: 3, p: 4, alignItems: 'center' }}>
          <TextField size='small' label={t('filters.action')} value={filters.action} onChange={event => setFilters(current => ({ ...current, action: event.target.value }))} />
          <TextField size='small' label={t('filters.targetType')} value={filters.targetType} onChange={event => setFilters(current => ({ ...current, targetType: event.target.value }))} />
          <TextField size='small' label={t('filters.targetId')} value={filters.targetId} onChange={event => setFilters(current => ({ ...current, targetId: event.target.value }))} />
          <Button variant='contained' onClick={apply}>{t('apply')}</Button>
          <Button onClick={clear}>{t('clear')}</Button>
        </Box>
      </Card>

      <Card>
        {state.kind === 'loading' && <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress size={28} aria-label={t('loading')} /></Box>}
        {state.kind === 'failed' && <Box sx={{ p: 6 }}><Alert severity='error' action={<Button color='inherit' size='small' onClick={() => void load()}>{t('retry')}</Button>}>{t('loadFailed')}</Alert></Box>}
        {state.kind === 'loaded' && state.events.length === 0 && <Box sx={{ px: 6, py: 10, textAlign: 'center', ...mutedSx }}>{t('empty')}</Box>}
        {state.kind === 'loaded' && state.events.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead><TableRow><TableCell>{t('columns.when')}</TableCell><TableCell>{t('columns.action')}</TableCell><TableCell>{t('columns.target')}</TableCell><TableCell>{t('columns.operator')}</TableCell><TableCell>{t('columns.result')}</TableCell><TableCell>{t('columns.reason')}</TableCell><TableCell align='right' /></TableRow></TableHead>
              <TableBody>{state.events.map(event => (
                <TableRow key={event.id} hover>
                  <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.created_at))}</TableCell>
                  <TableCell sx={cellSx}>{event.action}</TableCell>
                  <TableCell sx={cellSx}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{event.target.type}</Typography><Typography variant='caption' sx={mutedSx}>{event.target.id}</Typography></TableCell>
                  <TableCell sx={cellSx}>{event.actor?.username ?? t('system')}</TableCell>
                  <TableCell sx={cellSx}>{resultLabel(event.result)}</TableCell>
                  <TableCell sx={{ ...cellSx, maxWidth: 360, overflowWrap: 'anywhere' }}>{event.reason}</TableCell>
                  <TableCell align='right'><Button size='small' onClick={() => setDetail(event)}>{t('details')}</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
            {state.next && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><Button disabled={loadingMore} onClick={() => void load(state.next ?? undefined, true)}>{loadingMore ? t('loadingMore') : t('loadMore')}</Button></Box>}
          </Box>
        )}
      </Card>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth='md'>
        <DialogTitle>{t('detailTitle')}</DialogTitle>
        <DialogContent>{detail && <Box sx={{ display: 'grid', gap: 4, pt: 1 }}>
          <Box><Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>{t('before')}</Typography><Box component='pre' sx={{ m: 0, p: 3, borderRadius: 1, overflowX: 'auto', bgcolor: 'var(--at-surface-subtle)', fontSize: 12 }}>{snapshot(detail.before)}</Box></Box>
          <Box><Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>{t('after')}</Typography><Box component='pre' sx={{ m: 0, p: 3, borderRadius: 1, overflowX: 'auto', bgcolor: 'var(--at-surface-subtle)', fontSize: 12 }}>{snapshot(detail.after)}</Box></Box>
        </Box>}</DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>{t('close')}</Button></DialogActions>
      </Dialog>
    </>
  )
}
