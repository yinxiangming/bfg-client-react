'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { getConsoleErrorStatus, getWorkspaceUsage, type ConsoleUsage } from '@/services/console'

export type ConsoleUsageState =
  | { kind: 'loading' }
  | { kind: 'failed'; notFound: boolean; error: unknown }
  | { kind: 'loaded'; usage: ConsoleUsage }

/**
 * One workspace's metered usage for one month.
 *
 * The month is picked on the page, so a reader can change it faster than the API
 * answers; and the console switches workspaces inside one route. Either way an answer
 * that arrives after the page has moved on is dropped, or last month's figures would
 * land under this month's heading. Both a workspace the caller cannot reach (404, or 403
 * for an account that runs no workspace at all) and one that does not exist are reported
 * as "not found", exactly as the server means them to be.
 */
export function useConsoleWorkspaceUsage(workspaceId: number, month: string) {
  const [state, setState] = useState<ConsoleUsageState>({ kind: 'loading' })
  const currentRequest = useRef(0)

  const load = useCallback(async () => {
    const request = currentRequest.current + 1

    currentRequest.current = request
    setState({ kind: 'loading' })

    // /workspaces/abc/usage reaches this route too; no request is worth making for it.
    if (!Number.isInteger(workspaceId)) {
      setState({ kind: 'failed', notFound: true, error: null })

      return
    }

    try {
      const usage = await getWorkspaceUsage(workspaceId, month)

      if (currentRequest.current !== request) return

      setState({ kind: 'loaded', usage })
    } catch (error) {
      if (currentRequest.current !== request) return

      const status = getConsoleErrorStatus(error)

      setState({ kind: 'failed', notFound: status === 404 || status === 403, error })
    }
  }, [workspaceId, month])

  useEffect(() => {
    void load()

    // An answer for a month or a workspace the page has left is no longer anyone's.
    return () => {
      currentRequest.current += 1
    }
  }, [load])

  return { state, reload: load }
}
