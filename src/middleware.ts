import { NextRequest, NextResponse } from 'next/server'

const MOBILE_UA = /Mobi|Android|iPhone|iPad/i

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isMobile = MOBILE_UA.test(request.headers.get('user-agent') ?? '')

  // Mobile accessing desktop admin → redirect to mobile admin
  if (isMobile && pathname.startsWith('/admin') && !pathname.startsWith('/admin/m')) {
    return NextResponse.redirect(new URL('/admin/m', request.url))
  }

  // Desktop accessing mobile admin → redirect to desktop admin
  if (!isMobile && pathname.startsWith('/admin/m')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
