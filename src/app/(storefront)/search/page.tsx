'use client'

import { Suspense } from 'react'
import SearchPage from '@views/storefront/SearchPage'

function SearchFallback() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      Loading...
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPage />
    </Suspense>
  )
}
