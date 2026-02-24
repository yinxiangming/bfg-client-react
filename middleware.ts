import { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './src/i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  const modifiedRequest = new NextRequest(request.url, { headers: requestHeaders })
  return intlMiddleware(modifiedRequest)
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)'
  ]
}

