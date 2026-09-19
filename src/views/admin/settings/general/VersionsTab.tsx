'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { SETTINGS_GUTTER, SettingsSection } from '@/components/admin/settings/SettingsSection'
import type { Extension } from '@/extensions/registry'
import { loadPluginExtensions } from '@/extensions/loadExtensionsCore'
import type { ServerVersionResponse } from '@/utils/api'
import { fetchServerVersion } from '@/utils/api'

import clientPackage from '../../../../../package.json'

function clientAppVersion(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_VERSION
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim()
  return (clientPackage as { version?: string }).version ?? '—'
}

/** Label/value rows. Two columns once there is room, stacked on narrow panels. */
const detailGridSx = {
  display: 'grid',
  rowGap: 1,
  columnGap: 3,
  gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' }
} as const

export default function VersionsTab() {
  const t = useTranslations('admin')
  const [server, setServer] = useState<ServerVersionResponse | null>(null)
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const [sv, ext] = await Promise.all([fetchServerVersion(), loadPluginExtensions()])
        if (!cancelled) {
          setServer(sv)
          setExtensions(ext)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ px: SETTINGS_GUTTER, pt: 5, pb: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Typography variant='body2' color='text.secondary'>
          {t('settings.general.versions.intro')}
        </Typography>
      </Box>

      <SettingsSection title={t('settings.general.versions.sections.api')}>
        <Box sx={detailGridSx}>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.versions.labels.bfg')}
          </Typography>
          <Typography variant='body2'>{server?.bfg_version ?? '—'}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.versions.labels.workspaceServerApp')}
          </Typography>
          <Typography variant='body2'>{server?.workspace_server_app_version ?? '—'}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.versions.labels.apiVersion')}
          </Typography>
          <Typography variant='body2'>{server?.api_version ?? '—'}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.versions.labels.schemaVersion')}
          </Typography>
          <Typography variant='body2'>{server?.schema_version || '—'}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.versions.labels.buildId')}
          </Typography>
          <Typography variant='body2' sx={{ wordBreak: 'break-all' }}>
            {server?.build_id || '—'}
          </Typography>
        </Box>
      </SettingsSection>

      <SettingsSection title={t('settings.general.versions.sections.adminClient')}>
        <Box sx={detailGridSx}>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.versions.labels.packageName')}
          </Typography>
          <Typography variant='body2'>{(clientPackage as { name?: string }).name ?? '—'}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.versions.labels.clientVersion')}
          </Typography>
          <Typography variant='body2'>{clientAppVersion()}</Typography>
        </Box>
      </SettingsSection>

      <SettingsSection title={t('settings.general.versions.sections.djangoExtensions')}>
        {(server?.django_local_apps?.length ?? 0) === 0 ? (
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.versions.emptyDjangoApps')}
          </Typography>
        ) : (
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>{t('settings.general.versions.table.appId')}</TableCell>
                  <TableCell align='right'>{t('settings.general.versions.table.version')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(server?.django_local_apps ?? []).map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell align='right'>{row.version?.trim() ? row.version : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SettingsSection>

      <SettingsSection title={t('settings.general.versions.sections.nextExtensions')}>
        {extensions.length === 0 ? (
          <Typography variant='body2' color='text.secondary'>
            {t('settings.general.versions.emptyPlugins')}
          </Typography>
        ) : (
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>{t('settings.general.versions.table.extensionId')}</TableCell>
                  <TableCell>{t('settings.general.versions.table.extensionName')}</TableCell>
                  <TableCell align='right'>{t('settings.general.versions.table.version')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {extensions.map(ext => (
                  <TableRow key={ext.id}>
                    <TableCell>{ext.id}</TableCell>
                    <TableCell>{ext.name}</TableCell>
                    <TableCell align='right'>{ext.version?.trim() ? ext.version : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SettingsSection>
    </>
  )
}
