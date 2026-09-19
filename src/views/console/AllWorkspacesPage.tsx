'use client'

/**
 * Every workspace on the platform, for the people who run it.
 *
 * Only a platform administrator reaches this: the server answers everyone else with the
 * workspaces they own, so the page waits until it knows which it is dealing with and then
 * either lists or says plainly that this is not for them. From here a workspace is opened
 * in the same pages an owner sees.
 */

import { type ChangeEvent, useCallback, useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import Icon from '@components/Icon'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import StatusBadge from '@/components/schema/StatusBadge'
import { useConsole } from '@/contexts/ConsoleContext'
import {
  consoleWorkspaceStatus,
  listConsoleWorkspaces,
  listMoreConsoleWorkspaces,
  importConsoleWorkspace,
  type ConsoleWorkspace,
  type ConsoleWorkspaceStatus
} from '@/services/console'

import { WORKSPACE_STATUS_COLOR } from './workspaceStatus'

type ListState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; workspaces: ConsoleWorkspace[]; count: number; next: string | null }

export default function AllWorkspacesPage() {
  const t = useTranslations('admin.console.all')
  const tStatus = useTranslations('admin.workspaces.status')
  const tActions = useTranslations('admin.common.actions')
  const router = useRouter()
  const { state: consoleState } = useConsole()
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ConsoleWorkspaceStatus | ''>('')
  const [clusterFilter, setClusterFilter] = useState('')
  const [state, setState] = useState<ListState>({ kind: 'loading' })
  const [loadingMore, setLoadingMore] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importPayload, setImportPayload] = useState<Record<string, unknown> | null>(null)
  const [importFileName, setImportFileName] = useState('')
  const [importReason, setImportReason] = useState('')
  const [importConfirmed, setImportConfirmed] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const isPlatformAdmin = consoleState.kind === 'loaded' && consoleState.isPlatformAdmin

  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 300)

    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setState({ kind: 'loading' })

    try {
      const { workspaces, count, next } = await listConsoleWorkspaces({
        search: term,
        status: statusFilter || undefined,
        cluster: clusterFilter
      })

      setState({ kind: 'loaded', workspaces, count, next })
    } catch {
      setState({ kind: 'failed' })
    }
  }, [clusterFilter, statusFilter, term])

  useEffect(() => {
    // Anyone else would only get their own workspaces back, under a title that promises
    // all of them, so the request waits until the answer is worth making.
    if (isPlatformAdmin) void load()
  }, [isPlatformAdmin, load])

  const loadMore = async () => {
    if (state.kind !== 'loaded' || !state.next) return

    setLoadingMore(true)

    try {
      const page = await listMoreConsoleWorkspaces(state.next)

      setState(previous =>
        previous.kind === 'loaded'
          ? {
              kind: 'loaded',
              workspaces: [...previous.workspaces, ...page.workspaces],
              count: page.count,
              next: page.next
            }
          : previous
      )
    } catch {
      // What is already listed stays; the button can be pressed again.
    } finally {
      setLoadingMore(false)
    }
  }

  const openImport = () => {
    setImportPayload(null)
    setImportFileName('')
    setImportReason('')
    setImportConfirmed(false)
    setImportError(null)
    setImportOpen(true)
  }

  const closeImport = () => {
    if (!importing) setImportOpen(false)
  }

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImportError(null)
    if (file.size > 1_000_000) {
      setImportPayload(null)
      setImportFileName('')
      setImportError(t('importFileTooLarge'))
      return
    }

    try {
      const payload: unknown = JSON.parse(await file.text())
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid')
      setImportPayload(payload as Record<string, unknown>)
      setImportFileName(file.name)
    } catch {
      setImportPayload(null)
      setImportFileName('')
      setImportError(t('importInvalidFile'))
    }
  }

  const submitImport = async () => {
    if (!importPayload || importReason.trim().length < 3 || !importConfirmed) return

    setImporting(true)
    setImportError(null)
    try {
      const workspace = await importConsoleWorkspace(importPayload, importReason.trim())
      setImportOpen(false)
      router.push(`/workspaces/${workspace.id}`)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t('importFailed'))
    } finally {
      setImporting(false)
    }
  }

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

  if (!isPlatformAdmin) {
    return <Alert severity='info'>{t('forbidden')}</Alert>
  }

  const cellSx = { fontSize: 13, color: 'var(--at-row-fg)', whiteSpace: 'nowrap' as const }
  const mutedSx = { color: 'var(--at-row-sub)' }

  return (
    <>
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button variant='contained' onClick={openImport}>{t('import')}</Button>}
      />

      <Card>
        <Box
          sx={{
            px: 6,
            py: 4,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 4,
            borderBottom: '1px solid var(--at-card-border)'
          }}
        >
          <TextField
            size='small'
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('search')}
            sx={{ width: { xs: '100%', sm: 280 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='tabler-search' />
                  </InputAdornment>
                )
              }
            }}
          />
          <TextField
            select
            size='small'
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value as ConsoleWorkspaceStatus | '')}
            label={t('filters.status')}
            sx={{ width: { xs: '100%', sm: 160 } }}
          >
            <MenuItem value=''>{t('filters.allStatuses')}</MenuItem>
            <MenuItem value='active'>{tStatus('active')}</MenuItem>
            <MenuItem value='suspended'>{tStatus('suspended')}</MenuItem>
            <MenuItem value='inactive'>{tStatus('inactive')}</MenuItem>
          </TextField>
          <TextField
            size='small'
            value={clusterFilter}
            onChange={event => setClusterFilter(event.target.value)}
            label={t('filters.cluster')}
            placeholder={t('filters.clusterPlaceholder')}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />
          {state.kind === 'loaded' && (
            <>
              <Typography variant='caption' sx={{ ...mutedSx, ml: { sm: 'auto' } }}>{t('count', { count: state.count })}</Typography>
            </>
          )}
        </Box>

        {state.kind === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress size={28} aria-label={t('loading')} />
          </Box>
        )}

        {state.kind === 'failed' && (
          <Box sx={{ p: 6 }}>
            <Alert
              severity='error'
              action={
                <Button color='inherit' size='small' onClick={() => void load()}>
                  {tActions('retry')}
                </Button>
              }
            >
              {t('loadFailed')}
            </Alert>
          </Box>
        )}

        {state.kind === 'loaded' && state.workspaces.length === 0 && (
          <Box sx={{ px: 6, py: 10, textAlign: 'center', ...mutedSx }}>{t('empty')}</Box>
        )}

        {state.kind === 'loaded' && state.workspaces.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.workspace')}</TableCell>
                  <TableCell>{t('columns.domain')}</TableCell>
                  <TableCell>{t('columns.owner')}</TableCell>
                  <TableCell>{t('columns.cluster')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell>{t('columns.extensions')}</TableCell>
                  <TableCell align='right' />
                </TableRow>
              </TableHead>
              <TableBody>
                {state.workspaces.map(workspace => {
                  const status = consoleWorkspaceStatus(workspace)

                  return (
                    <TableRow key={workspace.id} hover>
                      <TableCell sx={cellSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Link href={`/workspaces/${workspace.id}`}>{workspace.name}</Link>
                          {workspace.is_platform && <StatusBadge noDot color='info' label={t('platform')} />}
                          {workspace.owned_by_viewer && <StatusBadge noDot label={t('yours')} />}
                        </Box>
                      </TableCell>
                      <TableCell sx={cellSx}>
                        {workspace.domains[0] ?? (
                          <Box component='span' sx={mutedSx}>
                            —
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        {workspace.owner?.username ?? (
                          <Box component='span' sx={mutedSx}>
                            {t('noOwner')}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        {workspace.cluster ? (
                          <Box>
                            <Box>{workspace.cluster.name}</Box>
                            <Box component='span' sx={{ ...mutedSx, fontSize: 12 }}>{workspace.cluster.region}</Box>
                          </Box>
                        ) : (
                          <Box component='span' sx={mutedSx}>—</Box>
                        )}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <StatusBadge label={tStatus(status)} color={WORKSPACE_STATUS_COLOR[status]} />
                      </TableCell>
                      <TableCell sx={cellSx}>
                        {workspace.active_extensions.length === 0 ? (
                          <Box component='span' sx={mutedSx}>
                            —
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {workspace.active_extensions.map(key => (
                              <StatusBadge key={key} noDot label={key} />
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align='right'>
                        <Button component={Link} href={`/workspaces/${workspace.id}`} size='small'>
                          {t('manage')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        {state.kind === 'loaded' && state.next && (
          <Box
            sx={{
              px: 6,
              py: 3,
              borderTop: '1px solid var(--at-card-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Typography variant='caption' sx={mutedSx}>
              {t('showing', { shown: state.workspaces.length, count: state.count })}
            </Typography>
            <Button
              size='small'
              sx={{ ml: 'auto' }}
              disabled={loadingMore}
              startIcon={loadingMore ? <CircularProgress size={14} color='inherit' /> : undefined}
              onClick={() => void loadMore()}
            >
              {t('loadMore')}
            </Button>
          </Box>
        )}
      </Card>

      <Dialog open={importOpen} onClose={closeImport} fullWidth maxWidth='sm'>
        <DialogTitle>{t('importTitle')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 3, pt: 1 }}>
            <Alert severity='info'>{t('importConfirm')}</Alert>
            {importError && <Alert severity='error'>{importError}</Alert>}
            <Button component='label' variant='outlined' disabled={importing} sx={{ justifySelf: 'start' }}>
              {t('importChooseFile')}
              <input hidden type='file' accept='application/json,.json' onChange={event => void importFile(event)} />
            </Button>
            <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
              {importFileName || t('importNoFile')}
            </Typography>
            <TextField
              label={t('importReason')}
              value={importReason}
              required
              multiline
              minRows={2}
              onChange={event => setImportReason(event.target.value)}
            />
            <FormControlLabel
              control={<Checkbox checked={importConfirmed} onChange={event => setImportConfirmed(event.target.checked)} />}
              label={t('importAcknowledge')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImport} disabled={importing}>{tActions('cancel')}</Button>
          <Button variant='contained' onClick={() => void submitImport()} disabled={importing || !importPayload || importReason.trim().length < 3 || !importConfirmed}>
            {importing ? t('loading') : t('import')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
