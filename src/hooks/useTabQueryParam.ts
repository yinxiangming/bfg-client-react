'use client'

/**
 * Keep a settings page's active tab in the URL as `?tab=`.
 *
 * The setup wizard links straight at individual settings — "add a payment
 * method" has to land on Finance › Gateways, not on Finance and a hunt through
 * nine rail entries. Tab state was local to each page, so every deep link
 * arrived at the first tab.
 *
 * Reads `window.location` rather than `useSearchParams` on purpose: the latter
 * opts the whole route into client-side rendering and needs a Suspense boundary
 * around every page that uses it, which is a lot of ceremony for one query
 * string. `history.replaceState` for the same reason — switching tabs is not a
 * navigation and should not push an entry the back button has to walk through.
 */

import { useEffect, useState } from 'react'

export function useTabQueryParam(validValues: string[], defaultValue: string) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab')

    // An unknown tab name (a stale bookmark, a renamed tab) falls back to the
    // default rather than rendering an empty panel.
    if (requested && validValues.includes(requested)) setActiveTab(requested)
    // Values are a static list per page; re-running on identity changes would
    // fight the user's own tab clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectTab = (value: string) => {
    setActiveTab(value)

    const url = new URL(window.location.href)

    url.searchParams.set('tab', value)
    window.history.replaceState(null, '', url)
  }

  return [activeTab, selectTab] as const
}

export default useTabQueryParam
