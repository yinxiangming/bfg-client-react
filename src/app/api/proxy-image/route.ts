/**
 * Proxy image fetch to avoid CORS when loading external images (e.g. from product scanner).
 * Server-side fetch is not subject to browser CORS.
 */

import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_PROTOCOLS = ['https:', 'http:']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = typeof body?.url === 'string' ? body.url.trim() : ''
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
    }
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ProductScanner/1.0'
      }
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream returned ${res.status}` }, { status: 502 })
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const blob = await res.arrayBuffer()
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=60'
      }
    })
  } catch (e) {
    console.error('Proxy image error:', e)
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 })
  }
}
