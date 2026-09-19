'use client'

/**
 * What one workspace is, and which of its extensions are on.
 *
 * It is the page a workspace's node in the tree opens, and the one the platform's list
 * hands over to, so it has to read the same for an owner looking at their own workspace
 * and for a platform administrator looking at someone else's.
 */

import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'
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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import Icon from '@components/Icon'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import StatusBadge from '@/components/schema/StatusBadge'
import { useConsole, useConsoleWorkspace } from '@/contexts/ConsoleContext'
import {
  consoleWorkspaceStatus,
  deleteConsoleWorkspace,
  exportConsoleWorkspace,
  extensionName,
  listConsoleWorkspaceOperations,
  resetConsoleAdminPassword,
  restoreConsoleWorkspace,
  resumeConsoleWorkspace,
  suspendConsoleWorkspace,
  type ConsoleWorkspaceOperation
} from '@/services/console'

import { useConsoleWorkspaceDetail } from './useConsoleWorkspaceDetail'
import { useEnterWorkspace } from './useEnterWorkspace'
import RuntimeFeatureAccessCard from './RuntimeFeatureAccessCard'
import { WORKSPACE_STATUS_COLOR } from './workspaceStatus'

type PlatformAction = 'suspend' | 'resume' | 'restore' | 'export' | 'resetPassword' | 'delete'

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: '120px minmax(0, 1fr)' },
        alignItems: 'center',
        gap: { xs: 0.5, sm: 4 },
        px: 4,
        py: 2.5,
        '&:not(:last-of-type)': { borderBottom: '1px solid var(--at-card-border)' }
      }}
    >
      <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
        {label}
      </Typography>
      <Box sx={{ minWidth: 0, fontSize: 13, color: 'var(--at-row-fg)', overflowWrap: 'anywhere' }}>{children}</Box>
    </Box>
  )
}

/** The same reading of an extension's state the extensions page shows, in one line. */
function extensionStatusLabel(
  extension: { status: string; available: boolean },
  t: (key: string) => string
): string {
  if (extension.status === 'active') return extension.available ? t('on') : t('notLive')
  if (extension.status === 'paused') return t('paused')
  if (extension.status === 'archived') return t('archived')
  if (extension.status === 'archiving' || extension.status === 'restoring') return t('working')

  return t('off')
}

function extensionStatusColor(extension: { status: string; available: boolean }): 'success' | 'warning' | 'default' {
  if (extension.status === 'active') return extension.available ? 'success' : 'warning'
  if (extension.status === 'paused') return 'warning'

  return 'default'
}

export default function WorkspaceOverviewPage({ workspaceId }: { workspaceId: number }) {
  const t = useTranslations('admin.console.overview')
  const tStatus = useTranslations('admin.workspaces.status')
  const tExtensions = useTranslations('admin.console.extensions')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const membership = useConsoleWorkspace(workspaceId)
  const { state: consoleState } = useConsole()
  const { state, reload } = useConsoleWorkspaceDetail(workspaceId)
  const enter = useEnterWorkspace(workspaceId)
  const [failure, setFailure] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [pendingAction, setPendingAction] = useState<PlatformAction | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [operations, setOperations] = useState<ConsoleWorkspaceOperation[] | null>(null)
  const [operationsFailed, setOperationsFailed] = useState(false)

  const loadOperations = useCallback(async () => {
    if (consoleState.kind !== 'loaded' || !consoleState.isPlatformAdmin) return
    setOperationsFailed(false)
    try {
      setOperations(await listConsoleWorkspaceOperations(workspaceId))
    } catch {
      setOperationsFailed(true)
    }
  }, [consoleState, workspaceId])

  useEffect(() => {
    void loadOperations()
  }, [loadOperations])

  // Switching into a workspace needs active staff there, owners included, so a platform
  // administrator looking at someone else's workspace is not offered the way in.
  const canEnter = Boolean(membership?.is_member)

  const enterAdmin = async () => {
    setFailure(null)

    if (!(await enter('/admin'))) setFailure(tExtensions('enterFailed'))
  }

  const runAction = async (action: () => Promise<unknown>) => {
    setFailure(null)
    setActionBusy(true)
    try {
      await action()
      await reload()
      await loadOperations()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : t('actionFailed'))
    } finally {
      setActionBusy(false)
    }
  }

  const openAction = (action: PlatformAction) => {
    setActionReason('')
    setPendingAction(action)
  }

  const closeAction = () => {
    if (!actionBusy) setPendingAction(null)
  }

  const actionLabel = (action: PlatformAction): string => {
    if (action === 'restore') return t('cancelDeletion')

    return t(action)
  }

  const submitAction = async () => {
    if (!pendingAction || actionReason.trim().length < 3) return

    const action = pendingAction
    const reason = actionReason.trim()
    setPendingAction(null)

    if (action === 'suspend') await runAction(() => suspendConsoleWorkspace(workspaceId, reason))
    else if (action === 'resume') await runAction(() => resumeConsoleWorkspace(workspaceId, reason))
    else if (action === 'restore') await runAction(() => restoreConsoleWorkspace(workspaceId, reason))
    else if (action === 'export') await runAction(() => downloadExport(reason))
    else if (action === 'resetPassword') await runAction(() => resetConsoleAdminPassword(workspaceId, reason))
    else await runAction(() => deleteConsoleWorkspace(workspaceId, reason))
  }

  const downloadExport = async (reason: string) => {
    const payload = await exportConsoleWorkspace(workspaceId, reason)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = `workspace-${workspaceId}.json`; anchor.click(); URL.revokeObjectURL(url)
  }

  if (state.kind === 'loading') {
    return (
      <Card sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={28} aria-label={t('loading')} />
      </Card>
    )
  }

  if (state.kind === 'failed') {
    return (
      <Alert
        severity='error'
        action={
          !state.notFound && (
            <Button color='inherit' size='small' onClick={() => void reload()}>
              {tActions('retry')}
            </Button>
          )
        }
      >
        {state.notFound ? t('notFound') : t('loadFailed')}
      </Alert>
    )
  }

  const workspace = state.workspace
  const status = consoleWorkspaceStatus(workspace)
  const canManageExtensions = workspace.capabilities?.extension_management === true
  const owner = workspace.owner?.username
  const createdAt = new Date(workspace.created_at)

  return (
    <>
      <AdminPageHeader
        title={t('title')}
        subtitle={`${workspace.name} · ${t('subtitle')}`}
        actions={
          canEnter ? (
            <Button variant='contained' startIcon={<Icon icon='tabler-login-2' />} onClick={() => void enterAdmin()}>
              {t('enter')}
            </Button>
          ) : undefined
        }
      />

      {failure && (
        <Alert severity='error' sx={{ mb: 4 }} onClose={() => setFailure(null)}>
          {failure}
        </Alert>
      )}

      {workspace.scheduled_deletion_at && (
        <Alert severity='warning' sx={{ mb: 4 }}>
          {t('deletionScheduled', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(workspace.scheduled_deletion_at)) })}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 6,
          alignItems: 'start',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }
        }}
      >
        <Card component='section'>
          <Box sx={{ px: 4, py: 3, borderBottom: '1px solid var(--at-card-border)' }}>
            <Typography component='h2' sx={{ fontSize: 14, fontWeight: 600, color: 'var(--at-row-fg)' }}>
              {t('details')}
            </Typography>
          </Box>
          <InfoRow label={t('fields.name')}>{workspace.name}</InfoRow>
          <InfoRow label={t('fields.domain')}>
            {workspace.domains[0] ?? <Box sx={{ color: 'var(--at-row-sub)' }}>{t('noDomain')}</Box>}
          </InfoRow>
          <InfoRow label={t('fields.status')}>
            <StatusBadge label={tStatus(status)} color={WORKSPACE_STATUS_COLOR[status]} />
          </InfoRow>
          <InfoRow label={t('fields.cluster')}>
            {workspace.cluster ? (
              <Box>
                <Typography component='span' sx={{ fontSize: 13, color: 'var(--at-row-fg)' }}>
                  {workspace.cluster.name}
                </Typography>
                <Typography component='span' sx={{ ml: 2, fontSize: 12, color: 'var(--at-row-sub)' }}>
                  {workspace.cluster.id} · {workspace.cluster.region.toUpperCase()}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ color: 'var(--at-row-sub)' }}>{t('noCluster')}</Box>
            )}
          </InfoRow>
          <InfoRow label={t('fields.owner')}>
            {owner ? (
              workspace.owned_by_viewer ? (
                t('ownerIsYou', { name: owner })
              ) : (
                owner
              )
            ) : (
              <Box sx={{ color: 'var(--at-row-sub)' }}>{t('noOwner')}</Box>
            )}
          </InfoRow>
          <InfoRow label={t('fields.staff')}>{t('staffCount', { count: workspace.staff_count })}</InfoRow>
          <InfoRow label={t('fields.created')}>
            {Number.isNaN(createdAt.getTime())
              ? workspace.created_at
              : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(createdAt)}
          </InfoRow>
        </Card>

        <Card component='section'>
          <Box
            sx={{
              px: 4,
              py: 2,
              minHeight: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              borderBottom: '1px solid var(--at-card-border)'
            }}
          >
            <Typography component='h2' sx={{ fontSize: 14, fontWeight: 600, color: 'var(--at-row-fg)' }}>
              {t('extensions')}
            </Typography>
            {canManageExtensions && (
              <Button component={Link} href={`/workspaces/${workspace.id}/extensions`} size='small'>
                {t('manageExtensions')}
              </Button>
            )}
          </Box>
          {workspace.extensions.length === 0 ? (
            <Box sx={{ px: 4, py: 6, color: 'var(--at-row-sub)', fontSize: 13 }}>{tExtensions('none')}</Box>
          ) : (
            workspace.extensions.map(extension => (
              <Box
                key={extension.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  px: 4,
                  py: 2.5,
                  '&:not(:last-of-type)': { borderBottom: '1px solid var(--at-card-border)' }
                }}
              >
                <Box aria-hidden sx={{ display: 'flex', fontSize: 18, color: 'var(--at-accent-soft-fg)' }}>
                  <Icon icon={extension.icon || 'tabler-puzzle'} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--at-row-fg)' }}>
                  {extensionName(extension, locale)}
                </Box>
                <StatusBadge
                  label={extensionStatusLabel(extension, tExtensions)}
                  color={extensionStatusColor(extension)}
                />
              </Box>
            ))
          )}
        </Card>
      </Box>

      {consoleState.kind === 'loaded' && consoleState.isPlatformAdmin && (
        <>
          <Card component='section' sx={{ mt: 6 }}>
            <Box sx={{ px: 4, py: 3, borderBottom: '1px solid var(--at-card-border)' }}>
              <Typography component='h2' sx={{ fontSize: 14, fontWeight: 600, color: 'var(--at-row-fg)' }}>{t('platformActions')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 4 }}>
              {workspace.scheduled_deletion_at ? (
                <Button disabled={actionBusy} onClick={() => openAction('restore')}>{t('cancelDeletion')}</Button>
              ) : status === 'suspended' || status === 'inactive' ? (
                <Button disabled={actionBusy} onClick={() => openAction('resume')}>{t('resume')}</Button>
              ) : (
                <Button disabled={actionBusy} onClick={() => openAction('suspend')}>{t('suspend')}</Button>
              )}
              <Button disabled={actionBusy} onClick={() => openAction('export')}>{t('export')}</Button>
              <Button disabled={actionBusy} onClick={() => openAction('resetPassword')}>{t('resetPassword')}</Button>
              <Button color='error' disabled={actionBusy} onClick={() => openAction('delete')}>{t('delete')}</Button>
            </Box>
          </Card>

          <RuntimeFeatureAccessCard workspaceId={workspaceId} />

          <Card component='section' sx={{ mt: 6 }}>
            <Box sx={{ px: 4, py: 3, borderBottom: '1px solid var(--at-card-border)' }}>
              <Typography component='h2' sx={{ fontSize: 14, fontWeight: 600, color: 'var(--at-row-fg)' }}>{t('operationHistory')}</Typography>
            </Box>
            {operations === null && !operationsFailed && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={22} aria-label={t('loadingOperations')} /></Box>
            )}
            {operationsFailed && (
              <Box sx={{ p: 4 }}><Alert severity='error' action={<Button color='inherit' size='small' onClick={() => void loadOperations()}>{tActions('retry')}</Button>}>{t('operationsFailed')}</Alert></Box>
            )}
            {operations?.length === 0 && <Box sx={{ px: 4, py: 5, color: 'var(--at-row-sub)', fontSize: 13 }}>{t('noOperations')}</Box>}
            {operations?.map(operation => (
              <Box key={operation.id} sx={{ px: 4, py: 2.5, display: 'flex', alignItems: 'center', gap: 3, '&:not(:last-child)': { borderBottom: '1px solid var(--at-card-border)' } }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 13, color: 'var(--at-row-fg)' }}>{t(`operations.${operation.operation}`)}</Typography>
                  <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(operation.started_at))}
                    {operation.initiated_by?.username ? ` · ${operation.initiated_by.username}` : ''}
                  </Typography>
                  {operation.error && <Typography variant='caption' component='div' sx={{ color: 'var(--mui-palette-error-main)', mt: 0.5 }}>{operation.error}</Typography>}
                </Box>
                <StatusBadge noDot color={operation.status === 'completed' ? 'success' : operation.status === 'failed' ? 'error' : operation.status === 'running' ? 'warning' : 'default'} label={t(`operationStatus.${operation.status}`)} />
              </Box>
            ))}
          </Card>
        </>
      )}

      <Dialog open={pendingAction !== null} onClose={closeAction} fullWidth maxWidth='sm'>
        <DialogTitle>{pendingAction ? actionLabel(pendingAction) : ''}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 3, pt: 1 }}>
            {pendingAction === 'delete' && <Alert severity='warning'>{t('deleteConfirm')}</Alert>}
            <TextField
              label={t('reasonPrompt')}
              value={actionReason}
              required
              multiline
              minRows={2}
              onChange={event => setActionReason(event.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAction} disabled={actionBusy}>{tActions('cancel')}</Button>
          <Button
            color={pendingAction === 'delete' ? 'error' : 'primary'}
            variant='contained'
            onClick={() => void submitAction()}
            disabled={actionBusy || actionReason.trim().length < 3}
            startIcon={actionBusy ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            {pendingAction ? actionLabel(pendingAction) : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
