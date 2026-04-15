import { NextRequest, NextResponse } from 'next/server'

const MOBILE_UA = /Mobi|Android|iPhone|iPad/i

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const isMobile = MOBILE_UA.test(request.headers.get('user-agent') ?? '')

    if (isMobile && !pathname.startsWith('/admin/m')) {
      return NextResponse.redirect(new URL('/admin/m', request.url))
    }

    if (!isMobile && pathname.startsWith('/admin/m')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
