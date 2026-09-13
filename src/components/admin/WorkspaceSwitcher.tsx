'use client'

/**
 * The admin topbar's workspace switcher: the workspaces the user is staff in, with the user's
 * role in each, and a link to /workspaces, which also lists the ones the user only owns.
 */

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'

import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import Icon from '@components/Icon'
import StatusBadge from '@/components/schema/StatusBadge'
import { listTenantWorkspaces, type TenantWorkspace } from '@/services/platform'
import { getWorkspaceIdFromJwt } from '@/utils/api'
import { switchWorkspace, WorkspaceSwitchError } from '@/utils/switchWorkspace'

type ListState =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'loaded'; workspaces: TenantWorkspace[] }

/** Message key under admin.workspaceSwitcher for a switch that failed with anything but a 401. */
function switchFailureKey(error: unknown): string {
  if (error instanceof WorkspaceSwitchError) {
    // No longer active staff there.
    if (error.status === 403) return 'switchFailed.notMember'
    // Deleted or deactivated since the list loaded.
    if (error.status === 404) return 'switchFailed.notFound'
  }
  return 'switchFailed.generic'
}

/**
 * A line of text among the menu items. Disabled, so arrow keys pass over it and a click does
 * nothing, but without the faded look of a disabled item.
 */
function menuNote(key: string, content: ReactNode, color = 'var(--at-row-sub)') {
  return (
    <MenuItem key={key} disabled sx={{ gap: 1.5, whiteSpace: 'normal', color, '&.Mui-disabled': { opacity: 1 } }}>
      {content}
    </MenuItem>
  )
}

export default function WorkspaceSwitcher() {
  const t = useTranslations('admin.workspaceSwitcher')
  const tWorkspaces = useTranslations('admin.workspaces')
  const tActions = useTranslations('admin.common.actions')
  const router = useRouter()
  const pathname = usePathname()
  const triggerId = useId()
  const menuId = useId()

  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<ListState>({ kind: 'loading' })
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [switchingId, setSwitchingId] = useState<number | null>(null)
  const [switchFailure, setSwitchFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setList({ kind: 'loading' })
    try {
      const { workspaces } = await listTenantWorkspaces()
      // switch-workspace refuses anyone who is not active staff, owners included, so the
      // workspaces the user only owns are left to /workspaces. Servers that predate is_member
      // leave it out, so only an explicit false is dropped.
      setList({ kind: 'loaded', workspaces: (workspaces ?? []).filter(workspace => workspace.is_member !== false) })
    } catch {
      setList({ kind: 'failed' })
    }
  }, [])

  useEffect(() => {
    // The workspace the access token was minted for, which is the one this admin shows.
    setCurrentId(getWorkspaceIdFromJwt())
    void load()
  }, [load])

  const current = list.kind === 'loaded' ? (list.workspaces.find(workspace => workspace.id === currentId) ?? null) : null
  const switching = switchingId !== null

  const handleSwitch = async (workspace: TenantWorkspace) => {
    if (switching) return

    if (workspace.id === currentId) {
      setOpen(false)
      return
    }

    setSwitchFailure(null)
    setSwitchingId(workspace.id)

    try {
      await switchWorkspace(workspace.id)
    } catch (error) {
      if (error instanceof WorkspaceSwitchError && error.status === 401) {
        // No refresh token, or the refresh failed and signed the user out.
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname || '/admin')}`)
        return
      }
      setSwitchingId(null)
      setSwitchFailure(switchFailureKey(error))
      // The failure shows in the menu, which may have been closed while the switch ran.
      setOpen(true)
      return
    }

    // A full page load, not router.refresh(): this tab still holds what it fetched and cached
    // with the previous workspace's token. The dashboard rather than this URL, which may name
    // a record, an order say, that only the previous workspace has.
    window.location.assign('/admin')
  }

  const renderWorkspace = (workspace: TenantWorkspace) => {
    const isCurrent = workspace.id === currentId
    // Suspended and deactivated workspaces refuse a switch.
    const blocked = workspace.status !== 'active'
    // The roles every workspace gets have labels; a role a workspace made itself shows its code.
    const roleLabel = workspace.role
      ? (tWorkspaces.has(`roles.${workspace.role}`) ? tWorkspaces(`roles.${workspace.role}`) : workspace.role)
      : null

    return (
      <MenuItem
        key={workspace.id}
        selected={isCurrent}
        disabled={blocked}
        aria-current={isCurrent ? 'true' : undefined}
        onClick={() => void handleSwitch(workspace)}
        sx={{ gap: 1.5, '&.Mui-disabled': { opacity: 1 } }}
      >
        <Box
          component='span'
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            color: blocked ? 'text.disabled' : 'var(--at-row-fg)'
          }}
        >
          <Box component='span' title={workspace.name} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
            {workspace.name}
          </Box>
          {roleLabel && (
            <Box
              component='span'
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: 12,
                lineHeight: 1.4,
                color: blocked ? 'inherit' : 'var(--at-row-sub)'
              }}
            >
              {roleLabel}
            </Box>
          )}
        </Box>
        {blocked && (
          <StatusBadge
            label={tWorkspaces(`status.${workspace.status}`)}
            color={workspace.status === 'suspended' ? 'error' : 'default'}
          />
        )}
        {switchingId === workspace.id ? (
          <CircularProgress size={14} color='inherit' aria-label={t('switching')} />
        ) : isCurrent ? (
          <Box component='i' className='tabler-check' aria-hidden sx={{ fontSize: 16, color: 'var(--at-accent)' }} />
        ) : null}
      </MenuItem>
    )
  }

  // Menu takes its items as a flat array: it looks through its direct children for the one to
  // focus, and a Fragment hides them.
  const items: ReactNode[] = []

  if (list.kind === 'loading') {
    items.push(menuNote('loading', [<CircularProgress key='spinner' size={14} color='inherit' />, t('loading')]))
  } else if (list.kind === 'failed') {
    items.push(
      menuNote('load-failed', t('loadFailed')),
      <MenuItem key='retry' onClick={() => void load()} sx={{ gap: 1.5 }}>
        <Box component='i' className='tabler-refresh' aria-hidden sx={{ fontSize: 16 }} />
        {tActions('retry')}
      </MenuItem>
    )
  } else if (list.workspaces.length === 0) {
    items.push(menuNote('empty', t('empty')))
  } else {
    items.push(...list.workspaces.map(renderWorkspace))
  }

  if (switchFailure) {
    items.push(menuNote('switch-failed', t(switchFailure), 'error.main'))
  }

  // The link to /workspaces stays, whether the list loaded, came back empty or failed to load.
  items.push(
    <Divider key='divider' component='li' />,
    <MenuItem key='my-shops' component={NextLink} href='/workspaces' onClick={() => setOpen(false)} sx={{ gap: 1.5 }}>
      <Box component='i' className='tabler-building-store' aria-hidden sx={{ fontSize: 16 }} />
      <Box component='span' sx={{ flex: 1 }}>
        {t('myShops')}
      </Box>
      <Box component='i' className='tabler-chevron-right' aria-hidden sx={{ fontSize: 14, color: 'var(--at-row-sub)' }} />
    </MenuItem>
  )

  const triggerLabel = switching
    ? t('switching')
    : current
      ? t('labelWithCurrent', { name: current.name })
      : t('label')

  return (
    <div className='workspace-switcher'>
      <button
        ref={setTrigger}
        id={triggerId}
        type='button'
        className='admin-topbar-btn workspace-switcher-trigger'
        onClick={() => setOpen(true)}
        aria-haspopup='menu'
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={triggerLabel}
        title={current?.name}
      >
        <Icon
          icon={switching ? 'tabler-loader-2' : 'tabler-building-store'}
          className={switching ? 'animate-spin' : undefined}
        />
        {current && <span className='workspace-switcher-name'>{current.name}</span>}
        <Icon icon='tabler-chevron-down' className='workspace-switcher-chevron' />
      </button>

      <Menu
        id={menuId}
        anchorEl={trigger}
        open={open && trigger !== null}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: { mt: 1, width: 300, maxWidth: 'calc(100vw - 32px)' } },
          list: { 'aria-labelledby': triggerId }
        }}
      >
        {items}
      </Menu>
    </div>
  )
}
