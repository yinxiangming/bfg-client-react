'use client'

/**
 * What every console page needs: the workspaces the signed-in account owns or works in,
 * and whether it administers the platform.
 *
 * One request serves the whole console, so the tree on the left and the list page read
 * the same answer and creating a workspace reloads both. A workspace opened from the
 * platform's list is in none of that, so the page that opens it hands the name back here
 * for the tree to show.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import {
  getPlatformControlStatus,
  listTenantWorkspaces,
  type TenantWorkspace,
  type TenantWorkspaceCreateBlocked,
} from '@/services/platform'
import { getWorkspaceIdFromJwt } from '@/utils/api'

export type ConsoleState =
  | { kind: 'loading' }
  | { kind: 'failed'; error: unknown }
  | {
      kind: 'loaded'
      workspaces: TenantWorkspace[]
      isPlatformAdmin: boolean
      platformCapabilities: { cluster_management: boolean; audit_log: boolean; configuration: boolean; exchange_rates: boolean }
      /** Why a create request would be refused right now; null when it would go ahead. */
      createBlocked: TenantWorkspaceCreateBlocked | null
      workspaceLimit: number
    }

/** A workspace the tree shows although the account does not own it. */
export type OpenWorkspace = { id: number; name: string }

type ConsoleContextValue = {
  state: ConsoleState
  /** The workspace the access token belongs to, which is the one /admin opens. */
  currentId: number | null
  openWorkspace: OpenWorkspace | null
  setOpenWorkspace: (workspace: OpenWorkspace | null) => void
  reload: () => Promise<void>
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null)

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConsoleState>({ kind: 'loading' })
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [openWorkspace, setOpen] = useState<OpenWorkspace | null>(null)

  // The pages hand back a fresh object on every load. Keeping the previous one when
  // nothing changed leaves the tree alone, which would otherwise collapse whatever the
  // reader had expanded.
  const setOpenWorkspace = useCallback((next: OpenWorkspace | null) => {
    setOpen(previous => {
      if (previous === next) return previous
      if (previous && next && previous.id === next.id && previous.name === next.name) return previous

      return next
    })
  }, [])

  const reload = useCallback(async () => {
    // A reload keeps whatever is on screen: the tree on the left would otherwise empty
    // out and fill in again every time a workspace is created.
    setState(previous => (previous.kind === 'loaded' ? previous : { kind: 'loading' }))

    try {
      const { workspaces, workspace_limit, create_blocked } = await listTenantWorkspaces()
      // ``me/`` remains the stable workspace-management contract. The isolated
      // control endpoint succeeds only for a Django superuser, so an expected
      // 403 means this signed-in user simply has no deployment controls.
      const control = await getPlatformControlStatus().catch(() => null)

      setState({
        kind: 'loaded',
        workspaces: workspaces ?? [],
        isPlatformAdmin: control?.is_platform_superuser === true,
        platformCapabilities: {
          cluster_management: Boolean(control?.platform_capabilities.cluster_management),
          audit_log: Boolean(control?.platform_capabilities.audit_log),
          configuration: Boolean(control?.platform_capabilities.configuration),
          exchange_rates: Boolean(control?.platform_capabilities.exchange_rates)
        },
        createBlocked: create_blocked ?? null,
        workspaceLimit: workspace_limit
      })
    } catch (error) {
      setState({ kind: 'failed', error })
    }
  }, [])

  useEffect(() => {
    // The token lives in the browser, so the workspace it belongs to is only known here.
    setCurrentId(getWorkspaceIdFromJwt())
    void reload()
  }, [reload])

  const value = useMemo(
    () => ({ state, currentId, openWorkspace, setOpenWorkspace, reload }),
    [state, currentId, openWorkspace, setOpenWorkspace, reload]
  )

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>
}

export function useConsole(): ConsoleContextValue {
  const value = useContext(ConsoleContext)

  if (!value) throw new Error('useConsole must be used inside ConsoleProvider')

  return value
}

/** The workspace `id` among the ones the account owns or works in, when it is one of them. */
export function useConsoleWorkspace(id: number | null): TenantWorkspace | null {
  const { state } = useConsole()

  if (id === null || state.kind !== 'loaded') return null

  return state.workspaces.find(workspace => workspace.id === id) ?? null
}
