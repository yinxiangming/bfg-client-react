import { NextRequest, NextResponse } from 'next/server'
import { isIndexableHost } from '@/utils/indexable'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Belt and braces alongside robots.txt. Disallow only asks a crawler not to fetch;
  // this is the header that actually keeps a URL out of an index, and it still
  // reaches crawlers that skip robots.txt or already hold the URL.
  if (!isIndexableHost(request.headers.get('x-forwarded-host') || request.headers.get('host'))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
