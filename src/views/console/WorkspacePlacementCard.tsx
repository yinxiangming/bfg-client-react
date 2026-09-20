'use client'

/** A Platform-only reservation panel; it never presents a reservation as a completed move. */

import { useCallback, useEffect, useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
  listConsoleClusters,
  listConsolePlacementRequests,
  reserveConsoleWorkspacePlacement,
  rollbackConsolePlacementReservation,
  type ConsoleCluster,
  type ConsolePlacementRequest
} from '@/services/consoleAdmin'
import { getConsoleControlWorkspace } from '@/services/console'

type State =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | {
      kind: 'loaded'
      clusters: ConsoleCluster[]
      placementFence: number
      assignedCluster: string | null
      reservations: ConsolePlacementRequest[]
    }

export default function WorkspacePlacementCard({ workspaceId }: { workspaceId: number }) {
  const t = useTranslations('admin.console.overview.placement')
  const locale = useLocale()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [targetClusterId, setTargetClusterId] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const [workspace, clusters, reservations] = await Promise.all([
        getConsoleControlWorkspace(workspaceId),
        listConsoleClusters(),
        listConsolePlacementRequests(workspaceId)
      ])
      setState({
        kind: 'loaded',
        clusters,
        placementFence: workspace.placement_fence ?? 0,
        assignedCluster: workspace.cluster?.id ?? null,
        reservations
      })
    } catch {
      setState({ kind: 'failed' })
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const activeReservation = state.kind === 'loaded'
    ? state.reservations.find(reservation => reservation.status === 'reserved') ?? null
    : null
  const availableClusters = state.kind === 'loaded'
    ? state.clusters.filter(cluster => cluster.is_active && cluster.is_accepting_new)
    : []

  const reserve = async () => {
    if (state.kind !== 'loaded' || !targetClusterId || reason.trim().length < 3) return
    setBusy(true)
    setFailure(null)
    try {
      await reserveConsoleWorkspacePlacement(workspaceId, targetClusterId, state.placementFence, reason.trim())
      setTargetClusterId('')
      setReason('')
      await load()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : t('actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  const rollback = async () => {
    if (!activeReservation || reason.trim().length < 3) return
    setBusy(true)
    setFailure(null)
    try {
      await rollbackConsolePlacementReservation(activeReservation.id, reason.trim())
      setReason('')
      await load()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : t('actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card component='section' sx={{ mt: 6 }}>
      <Box sx={{ px: 4, py: 3, borderBottom: '1px solid var(--at-card-border)' }}>
        <Typography component='h2' sx={{ fontSize: 14, fontWeight: 600, color: 'var(--at-row-fg)' }}>
          {t('title')}
        </Typography>
        <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
          {t('subtitle')}
        </Typography>
      </Box>

      {state.kind === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress size={22} aria-label={t('loading')} />
        </Box>
      )}
      {state.kind === 'failed' && (
        <Box sx={{ p: 4 }}>
          <Alert severity='error' action={<Button color='inherit' size='small' onClick={() => void load()}>{t('retry')}</Button>}>
            {t('loadFailed')}
          </Alert>
        </Box>
      )}
      {state.kind === 'loaded' && (
        <Box sx={{ p: 4, display: 'grid', gap: 3 }}>
          {failure && <Alert severity='error' onClose={() => setFailure(null)}>{failure}</Alert>}
          {state.assignedCluster ? (
            <Alert severity='info'>{t('migrationUnavailable')}</Alert>
          ) : activeReservation ? (
            <>
              <Alert severity='info'>
                {t('reserved', {
                  cluster: activeReservation.target_cluster.name,
                  expiry: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
                    new Date(activeReservation.reservation_expires_at)
                  )
                })}
              </Alert>
              <TextField
                label={t('reason')}
                value={reason}
                required
                multiline
                minRows={2}
                onChange={event => setReason(event.target.value)}
              />
              <Box>
                <Button color='warning' disabled={busy || reason.trim().length < 3} onClick={() => void rollback()}>
                  {busy ? t('working') : t('release')}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Alert severity='warning'>{t('reservationOnly')}</Alert>
              {availableClusters.length ? (
                <TextField
                  select
                  label={t('target')}
                  value={targetClusterId}
                  onChange={event => setTargetClusterId(event.target.value)}
                >
                  {availableClusters.map(cluster => (
                    <MenuItem key={cluster.id} value={cluster.id}>
                      {cluster.name} · {cluster.region.toUpperCase()} · {cluster.workspace_count}/{cluster.max_workspaces}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <Alert severity='info'>{t('noTargets')}</Alert>
              )}
              <TextField
                label={t('reason')}
                value={reason}
                required
                multiline
                minRows={2}
                onChange={event => setReason(event.target.value)}
              />
              <Box>
                <Button
                  variant='contained'
                  disabled={busy || !targetClusterId || reason.trim().length < 3}
                  onClick={() => void reserve()}
                >
                  {busy ? t('working') : t('reserve')}
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}
    </Card>
  )
}
