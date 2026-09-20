'use client'

/**
 * Load the setup checklist.
 *
 * Shared by the wizard page and the dashboard progress block so the number in
 * the sidebar and the number on the wizard cannot disagree.
 */

import { useCallback, useEffect, useState } from 'react'

import { getOnboardingStatus, type OnboardingStatus } from '@/services/onboarding'

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setStatus(await getOnboardingStatus())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    getOnboardingStatus()
      .then(next => {
        if (!cancelled) setStatus(next)
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // `setStatus` is exposed as well as `reload`: apply/skip already return the
  // recomputed status, so re-fetching it would be a second round trip for an
  // answer we are holding.
  return { status, setStatus, loading, error, reload }
}

export default useOnboarding
