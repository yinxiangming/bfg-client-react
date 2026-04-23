// Reusable hook for server-side paginated list data.
// The fetch function must accept { page, page_size, search?, ...extra } and return { results, count }.

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

export interface PagedResult<T> {
  results: T[]
  count: number
}

interface UsePagedDataOptions<Extra extends Record<string, any>> {
  extraParams?: Extra
  initialPageSize?: number
  /** Cookie key to persist the user's page-size preference. Defaults to a shared 'admin_page_size'. Pass null to disable. */
  pageSizeCookie?: string | null
}

const DEFAULT_PAGE_SIZE_COOKIE = 'admin_page_size'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 year

function readPageSizeCookie(name: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'))
  if (!match) return fallback
  const n = Number(decodeURIComponent(match[1]))
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function writePageSizeCookie(name: string, value: number) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(String(value))}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
}

export function usePagedData<T, Extra extends Record<string, any> = Record<string, never>>(
  fetchFn: (params: any) => Promise<PagedResult<T>>,
  options: UsePagedDataOptions<Extra> = {}
) {
  const { extraParams, initialPageSize = 20, pageSizeCookie = DEFAULT_PAGE_SIZE_COOKIE } = options

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(() =>
    pageSizeCookie ? readPageSizeCookie(pageSizeCookie, initialPageSize) : initialPageSize
  )
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<T[] | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const extraKey = JSON.stringify(extraParams ?? {})

  const fetchFnRef = useRef(fetchFn)
  useEffect(() => {
    fetchFnRef.current = fetchFn
  })

  const extraParamsRef = useRef(extraParams)
  useEffect(() => {
    extraParamsRef.current = extraParams
  })

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = {
        ...(extraParamsRef.current || {}),
        page: page + 1,
        page_size: pageSize,
      }
      if (search) params.search = search
      const result = await fetchFnRef.current(params)
      setItems(result.results)
      setCount(result.count)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, extraKey])

  const onSearchChange = useCallback((value: string) => {
    setSearch(prev => {
      if (prev !== value) setPage(0)
      return value
    })
  }, [])

  const onPageSizeChange = useCallback(
    (n: number) => {
      setPageSize(n)
      setPage(0)
      if (pageSizeCookie) writePageSizeCookie(pageSizeCookie, n)
    },
    [pageSizeCookie]
  )

  const serverPagination = useMemo(
    () => ({
      total: count,
      page,
      rowsPerPage: pageSize,
      onPageChange: setPage,
      onRowsPerPageChange: onPageSizeChange,
    }),
    [count, page, pageSize, onPageSizeChange]
  )

  return {
    items,
    count,
    loading,
    error,
    page,
    pageSize,
    search,
    setPage,
    setSearch,
    refetch,
    serverPagination,
    onSearchChange,
  }
}
