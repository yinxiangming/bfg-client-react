'use client'

import { useConsole } from '@/contexts/ConsoleContext'

/**
 * Whether the signed-in account administers the platform.
 *
 * One answer for the whole console, from the same request the tree is built
 * from, so a page and the nav never disagree about who is reading. `ready` is
 * what keeps a page from deciding before that answer is in: everything a
 * platform administrator alone may do is hidden until it is known, since an
 * entry that appears and then disappears reads as a bug, and one the server
 * would refuse reads as a dead end.
 */
export function usePlatformAdmin(): {
  ready: boolean
  failed: boolean
  isPlatformAdmin: boolean
  capabilities: { cluster_management: boolean; audit_log: boolean; configuration: boolean; exchange_rates: boolean }
} {
  const { state } = useConsole()

  return {
    ready: state.kind === 'loaded',
    failed: state.kind === 'failed',
    isPlatformAdmin: state.kind === 'loaded' && state.isPlatformAdmin,
    capabilities: state.kind === 'loaded'
      ? state.platformCapabilities
      : { cluster_management: false, audit_log: false, configuration: false, exchange_rates: false }
  }
}
