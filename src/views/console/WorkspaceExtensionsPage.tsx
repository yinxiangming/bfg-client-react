'use client'

/**
 * A workspace's extensions: what it can switch on, what it has on, and the switches.
 *
 * Extensions are managed here and nowhere else; a workspace's own admin has no page for
 * them. An owner of a suspended or deactivated workspace reads this page without being
 * able to change anything, which is also what the server answers.
 */

import { useState } from 'react'

import { useLocale, useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'

import Icon from '@components/Icon'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useAppDialog } from '@/contexts/AppDialogContext'
import { useConsole, useConsoleWorkspace } from '@/contexts/ConsoleContext'
import {
  activateExtension,
  consoleWorkspaceStatus,
  deactivateExtension,
  extensionName,
  getConsoleErrorCode,
  getConsoleErrorKeys,
  type ConsoleExtension
} from '@/services/console'

import ExtensionCard from './ExtensionCard'
import { useConsoleWorkspaceDetail } from './useConsoleWorkspaceDetail'
import { useEnterWorkspace } from './useEnterWorkspace'

export default function WorkspaceExtensionsPage({ workspaceId }: { workspaceId: number }) {
  const t = useTranslations('admin.console.extensions')
  const tActions = useTranslations('admin.common.actions')
  const locale = useLocale()
  const { confirm } = useAppDialog()
  const { state: consoleState } = useConsole()
  const membership = useConsoleWorkspace(workspaceId)
  const { state, reload, replaceExtension } = useConsoleWorkspaceDetail(workspaceId)
  const enter = useEnterWorkspace(workspaceId)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const isPlatformAdmin = consoleState.kind === 'loaded' && consoleState.isPlatformAdmin
  const workspace = state.kind === 'loaded' ? state.workspace : null
  const status = workspace ? consoleWorkspaceStatus(workspace) : 'active'
  // A platform administrator is held back by neither, exactly as the server has it.
  const readOnlyReason = !isPlatformAdmin && status !== 'active' ? status : null
  const canChange = readOnlyReason === null
  // Switching into a workspace needs active staff there, owners included.
  const canEnter = Boolean(membership?.is_member)

  const open = async (path: string) => {
    setFailure(null)

    if (!(await enter(path))) setFailure(t('enterFailed'))
  }

  /** What a refusal means, with the extensions it names written out. */
  const refusalMessage = (error: unknown): string => {
    const code = getConsoleErrorCode(error)

    if (!code || !t.has(`errors.${code}`)) return t('failed')

    const named =
      code === 'requires_inactive'
        ? getConsoleErrorKeys(error, 'requires')
        : code === 'required_by_active'
          ? getConsoleErrorKeys(error, 'required_by')
          : []
    const names = named
      .map(key => {
        const other = workspace?.extensions.find(extension => extension.key === key)

        return other ? extensionName(other, locale) : key
      })
      .join(locale.startsWith('zh') ? '、' : ', ')

    return t(`errors.${code}`, { names })
  }

  const change = async (extension: ConsoleExtension, action: 'activate' | 'deactivate') => {
    setBusyKey(extension.key)
    setFailure(null)

    try {
      const updated =
        action === 'activate'
          ? await activateExtension(workspaceId, extension.key)
          : await deactivateExtension(workspaceId, extension.key)

      replaceExtension(updated)
    } catch (error) {
      setFailure(refusalMessage(error))
    } finally {
      setBusyKey(null)
    }
  }

  const askThenDeactivate = async (extension: ConsoleExtension) => {
    const name = extensionName(extension, locale)
    const confirmed = await confirm(t('confirm.body', { name }), {
      title: t('confirm.title', { name }),
      confirmText: t('deactivate')
    })

    if (confirmed) await change(extension, 'deactivate')
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

  const { workspace: loaded } = state

  return (
    <>
      <AdminPageHeader
        title={t('title')}
        subtitle={`${loaded.name} · ${t('subtitle')}`}
        actions={
          canEnter ? (
            <Button variant='outlined' startIcon={<Icon icon='tabler-login-2' />} onClick={() => void open('/admin')}>
              {t('enter')}
            </Button>
          ) : undefined
        }
      />

      {readOnlyReason && (
        <Alert severity='info' sx={{ mb: 4 }}>
          {t(`readOnly.${readOnlyReason}`)}
        </Alert>
      )}

      {failure && (
        <Alert severity='error' sx={{ mb: 4 }} onClose={() => setFailure(null)}>
          {failure}
        </Alert>
      )}

      {loaded.extensions.length === 0 ? (
        <Card sx={{ px: 6, py: 12, textAlign: 'center' }}>
          <Box sx={{ color: 'var(--at-row-sub)' }}>{t('none')}</Box>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 4,
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }
          }}
        >
          {loaded.extensions.map(extension => (
            <ExtensionCard
              key={extension.key}
              extension={extension}
              canChange={canChange}
              busy={busyKey === extension.key}
              anyBusy={busyKey !== null}
              onActivate={() => void change(extension, 'activate')}
              onDeactivate={() => void askThenDeactivate(extension)}
              onSettings={extension.admin_url && canEnter ? () => void open(extension.admin_url) : undefined}
            />
          ))}
        </Box>
      )}
    </>
  )
}
