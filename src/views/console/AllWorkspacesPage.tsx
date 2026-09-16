'use client'

/**
 * Every workspace on the platform, for the people who run it.
 *
 * Only a platform administrator reaches this: the server answers everyone else with the
 * workspaces they own, so the page checks first and says plainly that it is not for them.
 * From here a workspace is opened in the same pages an owner sees.
 */

import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
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
  type ConsoleWorkspace,
  type ConsoleWorkspaceStatus
} from '@/services/console'

const STATUS_COLOR: Record<ConsoleWorkspaceStatus, 'success' | 'error' | 'default'> = {
  active: 'success',
  suspended: 'error',
  inactive: 'default'
}

type ListState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; workspaces: ConsoleWorkspace[]; count: number; hasMore: boolean }

export default function AllWorkspacesPage() {
  const t = useTranslations('admin.console.all')
  const tStatus = useTranslations('admin.workspaces.status')
  const tActions = useTranslations('admin.common.actions')
  const { state: consoleState, setOpenWorkspace } = useConsole()
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [state, setState] = useState<ListState>({ kind: 'loading' })

  const isPlatformAdmin = consoleState.kind !== 'loaded' || consoleState.isPlatformAdmin

  // The tree's platform group carries whichever workspace is open; back on the list, none is.
  useEffect(() => {
    setOpenWorkspace(null)
  }, [setOpenWorkspace])

  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 300)

    return () => clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setState({ kind: 'loading' })

    try {
      const { workspaces, count, hasMore } = await listConsoleWorkspaces(term)

      setState({ kind: 'loaded', workspaces, count, hasMore })
    } catch {
      setState({ kind: 'failed' })
    }
  }, [term])

  useEffect(() => {
    if (isPlatformAdmin) void load()
  }, [isPlatformAdmin, load])

  if (consoleState.kind === 'loaded' && !consoleState.isPlatformAdmin) {
    return <Alert severity='info'>{t('forbidden')}</Alert>
  }

  const cellSx = { fontSize: 13, color: 'var(--at-row-fg)', whiteSpace: 'nowrap' as const }
  const mutedSx = { color: 'var(--at-row-sub)' }

  return (
    <>
      <AdminPageHeader title={t('title')} subtitle={t('subtitle')} />

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
          {state.kind === 'loaded' && (
            <Typography variant='caption' sx={{ ml: { sm: 'auto' }, ...mutedSx }}>
              {t('count', { count: state.count })}
            </Typography>
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
                        {workspace.domains[0] ?? <Box component='span' sx={mutedSx}>—</Box>}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        {workspace.owner?.username ?? (
                          <Box component='span' sx={mutedSx}>
                            {t('noOwner')}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <StatusBadge label={tStatus(status)} color={STATUS_COLOR[status]} />
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

        {state.kind === 'loaded' && state.hasMore && (
          <Box sx={{ px: 6, py: 3, borderTop: '1px solid var(--at-card-border)', ...mutedSx, fontSize: 12 }}>
            {t('more', { shown: state.workspaces.length })}
          </Box>
        )}
      </Card>
    </>
  )
}
