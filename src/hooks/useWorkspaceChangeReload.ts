'use client'

/**
 * Reload the page when another tab moves the browser to a different workspace.
 *
 * Tabs share one access token, so once another tab switches workspace, requests from
 * this tab already run against the new workspace while its screen still shows the old
 * one — a save made here would land in a workspace the user is not looking at. A full
 * reload rather than `router.refresh()`, because providers and pages keep what they
 * fetched for the old workspace in client state, which a refresh preserves.
 *
 * `storage` fires only in the other tabs: the tab that switched reloads itself. The
 * tokens' `workspace_id` claims are compared rather than the tokens, so a refresh that
 * keeps the workspace reloads nothing, and neither does a sign-out, which leaves no token.
 */

import { useEffect } from 'react'

import { isWorkspaceAccessKey, readWorkspaceIdClaim } from '@/utils/authTokens'

export function useWorkspaceChangeReload(): void {
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || !isWorkspaceAccessKey(event.key) || !event.newValue) {
        return
      }

      if (readWorkspaceIdClaim(event.newValue) !== readWorkspaceIdClaim(event.oldValue)) {
        window.location.reload()
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => window.removeEventListener('storage', handleStorage)
  }, [])
}
