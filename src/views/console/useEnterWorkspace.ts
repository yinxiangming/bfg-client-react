'use client'

import { useRouter } from 'next/navigation'

import { useConsole } from '@/contexts/ConsoleContext'
import { switchWorkspace, WorkspaceSwitchError } from '@/utils/switchWorkspace'

/**
 * Opens a path in one workspace's admin, switching the token to that workspace first.
 *
 * Returns false when the way in is closed and the page should say so. A signed-out
 * account is sent to the sign-in page instead, as the workspaces list does: the admin's
 * own redirect only covers `/admin`, so nothing else would tell the user what happened.
 */
export function useEnterWorkspace(workspaceId: number) {
  const router = useRouter()
  const { currentId } = useConsole()

  return async (path: string): Promise<boolean> => {
    try {
      // The token already belongs to this workspace: nothing to switch.
      if (currentId !== workspaceId) await switchWorkspace(workspaceId)
    } catch (error) {
      if (error instanceof WorkspaceSwitchError && error.status === 401) {
        router.replace(`/auth/login?redirect=/workspaces/${workspaceId}`)
        return true
      }

      return false
    }

    // A full page load, not router.push(): this tab holds what it fetched and cached with
    // the previous workspace's token.
    window.location.assign(path)

    return true
  }
}
