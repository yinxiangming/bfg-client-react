// Custom hook for fetching API data with loading and error states

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseApiDataOptions<T> {
  fetchFn: () => Promise<T>
  enabled?: boolean
  deps?: React.DependencyList
}

export function useApiData<T>({ fetchFn, enabled = true, deps = [] }: UseApiDataOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchFnRef = useRef(fetchFn)

  // Update ref when fetchFn changes
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  const refetch = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)
      const result = await fetchFnRef.current()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchFnRef.current()
        if (!cancelled) {
          setData(result)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to fetch data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  return { data, loading, error, refetch }
}

