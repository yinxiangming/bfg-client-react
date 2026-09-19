'use client'

/** Platform-only management for the infrastructure clusters that host workspaces. */

import { useCallback, useEffect, useState } from 'react'

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
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import StatusBadge from '@/components/schema/StatusBadge'
import { createConsoleCluster, listConsoleClusters, updateConsoleCluster, type ConsoleCluster, type ConsoleClusterInput } from '@/services/consoleAdmin'

import { usePlatformAdmin } from '../usePlatformAdmin'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; clusters: ConsoleCluster[] }

type ClusterForm = Required<ConsoleClusterInput>

const blankForm: ClusterForm = {
  id: '',
  name: '',
  region: 'apac',
  api_base_url: '',
  frontend_base_url: '',
  db_host: '',
  db_port: 3306,
  redis_url: '',
  s3_bucket: '',
  max_workspaces: 500,
  is_accepting_new: true,
  is_active: true
}

function clusterForm(cluster: ConsoleCluster | null): ClusterForm {
  if (!cluster) return blankForm

  return {
    id: cluster.id,
    name: cluster.name,
    region: cluster.region,
    api_base_url: cluster.api_base_url,
    frontend_base_url: cluster.frontend_base_url,
    db_host: cluster.db_host,
    db_port: cluster.db_port,
    redis_url: '',
    s3_bucket: cluster.s3_bucket,
    max_workspaces: cluster.max_workspaces,
    is_accepting_new: cluster.is_accepting_new,
    is_active: cluster.is_active
  }
}

function healthColor(status: ConsoleCluster['health_status']): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'healthy') return 'success'
  if (status === 'degraded') return 'warning'
  if (status === 'down') return 'error'

  return 'default'
}

export default function ClustersPage() {
  const t = useTranslations('admin.console.clusters')
  const { ready, failed, isPlatformAdmin, capabilities } = usePlatformAdmin()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [editing, setEditing] = useState<ConsoleCluster | null | undefined>(undefined)
  const [form, setForm] = useState<ClusterForm>(blankForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      setState({ kind: 'loaded', clusters: await listConsoleClusters() })
    } catch {
      setState({ kind: 'failed' })
    }
  }, [])

  useEffect(() => {
    if (isPlatformAdmin && capabilities.cluster_management) void load()
  }, [isPlatformAdmin, capabilities.cluster_management, load])

  const open = (cluster: ConsoleCluster | null) => {
    setSaveError(null)
    setForm(clusterForm(cluster))
    setReason('')
    setConfirmed(false)
    setEditing(cluster)
  }

  const close = () => {
    if (!saving) setEditing(undefined)
  }

  const save = async () => {
    setSaveError(null)
    setSaving(true)
    try {
      if (editing === null) {
        await createConsoleCluster(form, reason.trim())
      } else if (editing) {
        const { id: _id, redis_url, ...changes } = form
        await updateConsoleCluster(editing.id, {
          ...changes,
          ...(redis_url.trim() ? { redis_url: redis_url.trim() } : {})
        }, reason.trim(), editing.config_version)
      }
      setEditing(undefined)
      await load()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (failed) return <Alert severity='error'>{t('loadFailed')}</Alert>

  if (!ready) {
    return (
      <Card sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={28} aria-label={t('loading')} />
      </Card>
    )
  }

  if (!isPlatformAdmin) return <Alert severity='info'>{t('forbidden')}</Alert>
  if (!capabilities.cluster_management) return <Alert severity='info'>{t('unavailable')}</Alert>

  const cellSx = { fontSize: 13, color: 'var(--at-row-fg)', verticalAlign: 'top' }
  const mutedSx = { color: 'var(--at-row-sub)' }

  return (
    <>
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button variant='contained' onClick={() => open(null)}>{t('add')}</Button>}
      />

      <Card>
        {state.kind === 'loading' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress size={28} aria-label={t('loading')} />
          </Box>
        )}

        {state.kind === 'failed' && (
          <Box sx={{ p: 6 }}>
            <Alert severity='error' action={<Button color='inherit' size='small' onClick={() => void load()}>Retry</Button>}>
              {t('loadFailed')}
            </Alert>
          </Box>
        )}

        {state.kind === 'loaded' && state.clusters.length === 0 && (
          <Box sx={{ px: 6, py: 10, textAlign: 'center', ...mutedSx }}>{t('empty')}</Box>
        )}

        {state.kind === 'loaded' && state.clusters.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.cluster')}</TableCell>
                  <TableCell>{t('columns.region')}</TableCell>
                  <TableCell sx={{ minWidth: 170 }}>{t('columns.usage')}</TableCell>
                  <TableCell>{t('columns.availability')}</TableCell>
                  <TableCell>{t('columns.health')}</TableCell>
                  <TableCell>{t('columns.endpoint')}</TableCell>
                  <TableCell align='right' />
                </TableRow>
              </TableHead>
              <TableBody>
                {state.clusters.map(cluster => (
                  <TableRow key={cluster.id} hover>
                    <TableCell sx={cellSx}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{cluster.name}</Typography>
                      <Typography variant='caption' sx={mutedSx}>{cluster.id}</Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>{t(`regions.${cluster.region}`)}</TableCell>
                    <TableCell sx={cellSx}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                        <Box>{cluster.workspace_count} / {cluster.max_workspaces}</Box>
                        <Box sx={mutedSx}>{cluster.capacity_percentage}%</Box>
                      </Box>
                      <LinearProgress variant='determinate' value={cluster.capacity_percentage} color={cluster.capacity_percentage >= 90 ? 'warning' : 'primary'} />
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                        <StatusBadge noDot color={cluster.is_active ? 'success' : 'default'} label={t(`status.${cluster.is_active ? 'active' : 'inactive'}`)} />
                        <StatusBadge noDot color={cluster.is_accepting_new ? 'info' : 'warning'} label={t(`status.${cluster.is_accepting_new ? 'accepting' : 'notAccepting'}`)} />
                      </Box>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <StatusBadge noDot color={healthColor(cluster.health_status)} label={t(`status.${cluster.health_status}`)} />
                    </TableCell>
                    <TableCell sx={{ ...cellSx, maxWidth: 260, overflowWrap: 'anywhere' }}>{cluster.api_base_url}</TableCell>
                    <TableCell align='right'><Button size='small' onClick={() => open(cluster)}>{t('manage')}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <Dialog open={editing !== undefined} onClose={close} fullWidth maxWidth='sm'>
        <DialogTitle>{editing ? t('editTitle', { name: editing.name }) : t('createTitle')}</DialogTitle>
        <DialogContent>
          {saveError && <Alert severity='error' sx={{ mb: 4 }}>{saveError}</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 3, pt: 1 }}>
            <TextField label={t('fields.id')} value={form.id} disabled={Boolean(editing)} required onChange={event => setForm(current => ({ ...current, id: event.target.value }))} />
            <TextField label={t('fields.name')} value={form.name} required onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
            <TextField select label={t('fields.region')} value={form.region} onChange={event => setForm(current => ({ ...current, region: event.target.value as ConsoleCluster['region'] }))}>
              <MenuItem value='us'>{t('regions.us')}</MenuItem>
              <MenuItem value='eu'>{t('regions.eu')}</MenuItem>
              <MenuItem value='apac'>{t('regions.apac')}</MenuItem>
            </TextField>
            <TextField type='number' label={t('fields.capacity')} value={form.max_workspaces} required onChange={event => setForm(current => ({ ...current, max_workspaces: Number(event.target.value) }))} />
            <TextField label={t('fields.api')} value={form.api_base_url} required sx={{ gridColumn: { sm: 'span 2' } }} onChange={event => setForm(current => ({ ...current, api_base_url: event.target.value }))} />
            <TextField label={t('fields.frontend')} value={form.frontend_base_url} sx={{ gridColumn: { sm: 'span 2' } }} onChange={event => setForm(current => ({ ...current, frontend_base_url: event.target.value }))} />
          </Box>

          <Typography sx={{ mt: 5, mb: 3, fontSize: 14, fontWeight: 600 }}>{t('configuration')}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
            <TextField label={t('fields.dbHost')} value={form.db_host} required onChange={event => setForm(current => ({ ...current, db_host: event.target.value }))} />
            <TextField type='number' label={t('fields.dbPort')} value={form.db_port} required onChange={event => setForm(current => ({ ...current, db_port: Number(event.target.value) }))} />
            <TextField label={t('fields.redis')} value={form.redis_url} required={editing === null} type='password' placeholder={editing ? t('redisUnchanged') : undefined} sx={{ gridColumn: { sm: 'span 2' } }} onChange={event => setForm(current => ({ ...current, redis_url: event.target.value }))} />
            <TextField label={t('fields.bucket')} value={form.s3_bucket} required sx={{ gridColumn: { sm: 'span 2' } }} onChange={event => setForm(current => ({ ...current, s3_bucket: event.target.value }))} />
          </Box>

          <Typography sx={{ mt: 5, mb: 2, fontSize: 14, fontWeight: 600 }}>{t('capacity')}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <FormControlLabel control={<Switch checked={form.is_accepting_new} onChange={event => setForm(current => ({ ...current, is_accepting_new: event.target.checked }))} />} label={t('fields.accepting')} />
            <FormControlLabel control={<Switch checked={form.is_active} onChange={event => setForm(current => ({ ...current, is_active: event.target.checked }))} />} label={t('fields.active')} />
          </Box>

          <TextField
            label={t('reason')}
            value={reason}
            required
            multiline
            minRows={2}
            sx={{ mt: 4, width: '100%' }}
            onChange={event => setReason(event.target.value)}
          />
          <FormControlLabel
            sx={{ mt: 1 }}
            control={<Checkbox checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />}
            label={t('confirm')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={saving}>Cancel</Button>
          <Button variant='contained' onClick={() => void save()} disabled={saving || reason.trim().length < 3 || !confirmed}>{editing ? t('save') : t('create')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
