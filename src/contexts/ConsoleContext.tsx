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

import { listTenantWorkspaces, type TenantWorkspace, type TenantWorkspaceCreateBlocked } from '@/services/platform'
import { getWorkspaceIdFromJwt } from '@/utils/api'

export type ConsoleState =
  | { kind: 'loading' }
  | { kind: 'failed'; error: unknown }
  | {
      kind: 'loaded'
      workspaces: TenantWorkspace[]
      isPlatformAdmin: boolean
      platformCapabilities: { cluster_management: boolean; configuration: boolean }
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
      const { workspaces, is_platform_admin, is_platform_superuser, workspace_limit, create_blocked, platform_capabilities } = await listTenantWorkspaces()

      setState({
        kind: 'loaded',
        workspaces: workspaces ?? [],
        isPlatformAdmin: Boolean(is_platform_superuser ?? is_platform_admin),
        platformCapabilities: platform_capabilities ?? { cluster_management: false, configuration: false },
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
