'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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
 * Both a workspace the caller cannot reach (404, or 403 for an account that runs no
 * workspace at all) and one that does not exist are reported as "not found", exactly as
 * the server means them to be.
 *
 * The console switches between workspaces in one route, so an answer that arrives after
 * the page has moved on is dropped: it would otherwise show one workspace's extensions
 * while the switches acted on another.
 */
export function useConsoleWorkspaceDetail(workspaceId: number) {
  const { setOpenWorkspace } = useConsole()
  const [state, setState] = useState<ConsoleDetailState>({ kind: 'loading' })
  const currentRequest = useRef(0)

  const load = useCallback(async () => {
    const request = currentRequest.current + 1

    currentRequest.current = request
    setState({ kind: 'loading' })

    // /workspaces/abc reaches this route too; no request is worth making for it.
    if (!Number.isInteger(workspaceId)) {
      setState({ kind: 'failed', notFound: true, error: null })
      return
    }

    try {
      const workspace = await getConsoleWorkspace(workspaceId)

      if (currentRequest.current !== request) return

      setState({ kind: 'loaded', workspace })
      setOpenWorkspace({ id: workspace.id, name: workspace.name })
    } catch (error) {
      if (currentRequest.current !== request) return

      const status = getConsoleErrorStatus(error)

      setState({ kind: 'failed', notFound: status === 404 || status === 403, error })
    }
  }, [workspaceId, setOpenWorkspace])

  useEffect(() => {
    void load()

    // An answer for a workspace the page has left is no longer anyone's.
    return () => {
      currentRequest.current += 1
    }
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
