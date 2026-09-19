'use client'

/** Platform-superuser controls for server-registered runtime feature grants. */
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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import StatusBadge from '@/components/schema/StatusBadge'
import {
  listEntitlements,
  listRuntimeEntitlementFeatures,
  revokeEntitlement,
  type ConsoleEntitlement,
  type ConsoleGrant
} from '@/services/consoleAdmin'

import { formatMoment } from './billingPeriods'
import GrantEntitlementDialog from './GrantEntitlementDialog'
import { refusalMessage } from './refusal'

type State =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; entitlements: ConsoleEntitlement[]; features: string[] }

export default function RuntimeFeatureAccessCard({ workspaceId }: { workspaceId: number }) {
  const t = useTranslations('admin.console.overview')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [granting, setGranting] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [revoking, setRevoking] = useState<ConsoleEntitlement | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [revokeFailure, setRevokeFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const [entitlements, features] = await Promise.all([
        listEntitlements(workspaceId),
        listRuntimeEntitlementFeatures(workspaceId)
      ])
      setState({ kind: 'loaded', entitlements, features })
    } catch {
      setState({ kind: 'failed' })
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const openRevoke = (entitlement: ConsoleEntitlement) => {
    setRevoking(entitlement)
    setRevokeReason('')
    setRevokeFailure(null)
  }

  const closeRevoke = () => {
    if (busyId === null) setRevoking(null)
  }

  const revoke = async () => {
    if (!revoking || revokeReason.trim().length < 3) return
    setBusyId(revoking.id)
    setRevokeFailure(null)
    try {
      await revokeEntitlement(workspaceId, revoking.id, revokeReason.trim())
      setRevoking(null)
      await load()
    } catch (error) {
      setRevokeFailure(refusalMessage(error, t('actionFailed'), () => null))
    } finally {
      setBusyId(null)
    }
  }

  const featureName = (key: string) => (
    t.has(`runtimeFeatures.names.${key}`) ? t(`runtimeFeatures.names.${key}`) : key
  )

  const onGranted = (_grant: ConsoleGrant) => {
    setGranting(false)
    void load()
  }

  return (
    <Card component='section' sx={{ mt: 6 }}>
      <Box sx={{ px: 4, py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, borderBottom: '1px solid var(--at-card-border)' }}>
        <Box>
          <Typography component='h2' sx={{ fontSize: 14, fontWeight: 600, color: 'var(--at-row-fg)' }}>{t('runtimeFeatures.title')}</Typography>
          <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>{t('runtimeFeatures.subtitle')}</Typography>
        </Box>
        <Button
          size='small'
          variant='outlined'
          onClick={() => setGranting(true)}
          disabled={state.kind !== 'loaded' || state.features.length === 0}
        >
          {t('grantFeature')}
        </Button>
      </Box>

      {state.kind === 'loading' && <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={22} aria-label={t('loadingFeatures')} /></Box>}
      {state.kind === 'failed' && <Box sx={{ p: 4 }}><Alert severity='error' action={<Button color='inherit' size='small' onClick={() => void load()}>{tActions('retry')}</Button>}>{t('featuresFailed')}</Alert></Box>}
      {state.kind === 'loaded' && state.entitlements.length === 0 && <Box sx={{ px: 4, py: 5, color: 'var(--at-row-sub)', fontSize: 13 }}>{t('noRuntimeFeatures')}</Box>}
      {state.kind === 'loaded' && state.entitlements.map(entitlement => (
        <Box key={entitlement.id} sx={{ px: 4, py: 2.5, display: 'flex', alignItems: 'center', gap: 3, '&:not(:last-child)': { borderBottom: '1px solid var(--at-card-border)' } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, color: 'var(--at-row-fg)' }}>{featureName(entitlement.key)}</Typography>
            <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
              {entitlement.current_period_end ? t('runtimeFeatures.until', { date: formatMoment(entitlement.current_period_end, locale) }) : t('runtimeFeatures.forever')}
              {entitlement.reason ? ` · ${entitlement.reason}` : ''}
            </Typography>
          </Box>
          <StatusBadge noDot color={entitlement.is_effective ? 'success' : entitlement.status === 'revoked' ? 'default' : 'warning'} label={t(`runtimeFeatures.status.${entitlement.is_effective ? 'effective' : entitlement.status}`)} />
          {entitlement.is_effective && <Button color='error' size='small' disabled={busyId === entitlement.id} onClick={() => openRevoke(entitlement)}>{t('revokeFeature')}</Button>}
        </Box>
      ))}

      <GrantEntitlementDialog
        open={granting}
        workspaceId={workspaceId}
        features={state.kind === 'loaded' ? state.features : []}
        onClose={() => setGranting(false)}
        onGranted={onGranted}
      />

      <Dialog open={Boolean(revoking)} onClose={closeRevoke} fullWidth maxWidth='sm'>
        <DialogTitle>{t('revokeFeature')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 3, pt: 1 }}>
            <Alert severity='warning'>{t('revokeFeatureConfirm')}</Alert>
            {revokeFailure && <Alert severity='error'>{revokeFailure}</Alert>}
            <TextField
              label={t('reasonPrompt')}
              value={revokeReason}
              required
              multiline
              minRows={2}
              onChange={event => setRevokeReason(event.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRevoke} disabled={busyId !== null}>{tActions('cancel')}</Button>
          <Button
            color='error'
            variant='contained'
            onClick={() => void revoke()}
            disabled={busyId !== null || revokeReason.trim().length < 3}
            startIcon={busyId !== null ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            {t('revokeFeature')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
