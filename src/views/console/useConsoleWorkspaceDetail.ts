'use client'

import { useCallback, useEffect, useState } from 'react'

import { useConsole } from '@/contexts/ConsoleContext'
import {
  getConsoleErrorStatus,
  getConsoleWorkspace,
  type ConsoleExtension,
  type ConsoleWorkspaceDetail
} from '@/services/console'

export type ConsoleDetailState =
  | { kind: 'loading' }
  | { kind: 'failed'; notFound: boolean; error: unknown }
  | { kind: 'loaded'; workspace: ConsoleWorkspaceDetail }

/**
 * One workspace with its extensions, for the pages under `/workspaces/[id]`.
 *
 * A workspace the account does not own is reached from the platform's list, so the tree
 * has no node for it until the name loads here; that is what `setOpenWorkspace` is for.
 * A workspace the caller cannot reach answers 404, exactly as a missing one does, and
 * both are shown as "not found".
 */
export function useConsoleWorkspaceDetail(workspaceId: number) {
  const { setOpenWorkspace } = useConsole()
  const [state, setState] = useState<ConsoleDetailState>({ kind: 'loading' })

  const load = useCallback(async () => {
    setState({ kind: 'loading' })

    try {
      const workspace = await getConsoleWorkspace(workspaceId)

      setState({ kind: 'loaded', workspace })
      setOpenWorkspace({ id: workspace.id, name: workspace.name })
    } catch (error) {
      setState({ kind: 'failed', notFound: getConsoleErrorStatus(error) === 404, error })
    }
  }, [workspaceId, setOpenWorkspace])

  useEffect(() => {
    void load()
  }, [load])

  /** Put a changed extension back in place, so a switch does not reload the page. */
  const replaceExtension = useCallback((extension: ConsoleExtension) => {
    setState(previous => {
      if (previous.kind !== 'loaded') return previous

      return {
        kind: 'loaded',
        workspace: {
          ...previous.workspace,
          extensions: previous.workspace.extensions.map(current =>
            current.key === extension.key ? extension : current
          )
        }
      }
    })
  }, [])

  return { state, reload: load, replaceExtension }
}
