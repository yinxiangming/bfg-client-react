'use client'

/**
 * /workspaces: every workspace the signed-in user owns or is staff in, one card each, with
 * a way into each one's admin, a way to manage the ones they own, and a way to create another.
 *
 * It is the console's home page. The tree on the left manages one workspace at a time; this
 * is where they are all listed, staff-only ones included, and those have nothing to manage
 * here beyond opening their admin.
 */

import { useId, useState } from 'react'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import { useConsole } from '@/contexts/ConsoleContext'
import {
  getTenantWorkspaceCodeMessage,
  getTenantWorkspaceErrorMessage,
  type TenantWorkspace
} from '@/services/platform'
import { switchWorkspace, WorkspaceSwitchError } from '@/utils/switchWorkspace'

import CreateWorkspaceDialog from './CreateWorkspaceDialog'
import WorkspaceCard from './WorkspaceCard'

type EnterFailure = {
  workspaceId: number
  error: unknown
}

/** Message key under admin.workspaces for a switch that failed with anything but a 401. */
function enterFailureKey(error: unknown): string {
  if (error instanceof WorkspaceSwitchError) {
    // Not active staff there (any more: the card already disables is_member: false).
    if (error.status === 403) return 'blocked.notMember'
    // Deleted or deactivated since the list loaded.
    if (error.status === 404) return 'enterFailed.notFound'
  }

  return 'enterFailed.generic'
}

export default function WorkspacesPage() {
  const t = useTranslations('admin.workspaces')
  const tActions = useTranslations('admin.common.actions')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const createBlockedId = useId()

  // The console loads this list once for the whole area: the tree on the left reads the
  // same answer, so creating a workspace fills in both.
  const { state, currentId, reload } = useConsole()
  const [enteringId, setEnteringId] = useState<number | null>(null)
  const [enterFailure, setEnterFailure] = useState<EnterFailure | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  /** The name of a workspace that was created but could not be switched to. */
  const [createdNotSwitched, setCreatedNotSwitched] = useState<string | null>(null)

  const handleEnter = async (workspace: TenantWorkspace) => {
    if (enteringId !== null) return

    setEnterFailure(null)
    setEnteringId(workspace.id)

    // The token already belongs to this workspace: nothing to switch.
    if (workspace.id === currentId) {
      router.push('/admin')
      return
    }

    try {
      await switchWorkspace(workspace.id)
    } catch (error) {
      if (error instanceof WorkspaceSwitchError && error.status === 401) {
        // No refresh token, or the refresh failed and signed the user out.
        router.replace('/auth/login?redirect=/workspaces')
        return
      }
      setEnteringId(null)
      setEnterFailure({ workspaceId: workspace.id, error })
      return
    }

    // A full page load, not router.push(): this tab still holds what it fetched and cached
    // with the previous workspace's token.
    window.location.assign('/admin')
  }

  // The workspace exists; the list shows it, and its card opens its admin.
  const handleSwitchFailed = (workspace: TenantWorkspace) => {
    setCreateOpen(false)
    setCreatedNotSwitched(workspace.name)
    void reload()
  }

  const loadFailureMessage = (error: unknown) => {
    const message = getTenantWorkspaceErrorMessage(error)
    return message ? tCommon(message.key, message.values) : t('loadFailed')
  }

  // Whether the user may create a workspace is me/'s answer, never a count made here.
  const createBlockedMessage = (() => {
    if (state.kind !== 'loaded' || state.createBlocked === null) return null
    const message = getTenantWorkspaceCodeMessage(state.createBlocked, state.workspaceLimit)
    return message ? tCommon(message.key, message.values) : null
  })()

  const listIsEmpty = state.kind === 'loaded' && state.workspaces.length === 0

  const createButton = (
    <Button
      variant='contained'
      size='small'
      startIcon={<i className='tabler-plus' />}
      // Also disabled until me/ has answered, and while a workspace's admin is being opened.
      disabled={state.kind !== 'loaded' || state.createBlocked !== null || enteringId !== null}
      aria-describedby={createBlockedMessage ? createBlockedId : undefined}
      onClick={() => setCreateOpen(true)}
    >
      {t('create.button')}
    </Button>
  )

  const createBlockedNote = createBlockedMessage && (
    <Typography id={createBlockedId} variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
      {createBlockedMessage}
    </Typography>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
        <div>
          <h1 className='at-page-title'>{t('title')}</h1>
          <p className='at-page-subtitle'>{t('subtitle')}</p>
        </div>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'flex-start', sm: 'flex-end' },
            gap: 1.5,
            maxWidth: { sm: 360 },
            textAlign: { xs: 'left', sm: 'right' }
          }}
        >
          {createButton}
          {/* An empty list repeats the button in its card, and the reason sits with that one. */}
          {!listIsEmpty && createBlockedNote}
        </Box>
      </Box>

      {createdNotSwitched && (
        <Alert severity='warning' onClose={() => setCreatedNotSwitched(null)}>
          {t('create.createdNotSwitched', { name: createdNotSwitched })}
        </Alert>
      )}

      {state.kind === 'loading' && (
        <Card sx={{ display: 'flex', justifyContent: 'center', py: 16 }}>
          <CircularProgress size={28} aria-label={t('loading')} />
        </Card>
      )}

      {state.kind === 'failed' && (
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={() => void reload()}>
              {tActions('retry')}
            </Button>
          }
        >
          {loadFailureMessage(state.error)}
        </Alert>
      )}

      {listIsEmpty && (
        <Card sx={{ px: 6, py: 12, textAlign: 'center' }}>
          <Typography
            component='h2'
            sx={{ fontFamily: 'var(--at-font-display)', fontSize: 15, fontWeight: 600, color: 'var(--at-row-fg)' }}
          >
            {t('empty.title')}
          </Typography>
          <Typography variant='body2' sx={{ mt: 2, color: 'var(--at-row-sub)' }}>
            {t('empty.description')}
          </Typography>
          <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            {createButton}
            {createBlockedNote}
          </Box>
        </Card>
      )}

      {state.kind === 'loaded' && state.workspaces.length > 0 && (
        <>
          <Box
            sx={{
              display: 'grid',
              gap: 6,
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                md: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))'
              }
            }}
          >
            {state.workspaces.map(workspace => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                isCurrent={workspace.id === currentId}
                entering={enteringId === workspace.id}
                busy={enteringId !== null}
                // Only an owner has anything to manage: extensions, and later usage and bills.
                manageHref={workspace.is_owner ? `/workspaces/${workspace.id}` : undefined}
                enterError={enterFailure?.workspaceId === workspace.id ? t(enterFailureKey(enterFailure.error)) : null}
                onEnter={() => void handleEnter(workspace)}
                onDismissError={() => setEnterFailure(null)}
              />
            ))}
          </Box>
          <Typography variant='caption' sx={{ color: 'var(--at-row-sub)' }}>
            {t('billingNote')}
          </Typography>
        </>
      )}

      <CreateWorkspaceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onRefused={() => void reload()}
        onSwitchFailed={handleSwitchFailed}
      />
    </Box>
  )
}
