/**
 * Proxy an external image so the product scanner can load it without hitting
 * browser CORS. The fetch runs on the server, so this endpoint must not become
 * a server-side request forgery (SSRF) hole:
 *
 *  1. Same-origin only. The single caller is the admin scanner
 *     (`utils/scannedImage.ts`), a same-origin `fetch`. Any cross-site caller is
 *     rejected, so a random page cannot make our server fetch arbitrary URLs.
 *  2. No internal targets. The host is resolved and rejected if it points at a
 *     private, loopback, link-local or otherwise internal address (including the
 *     cloud metadata address 169.254.169.254). Redirects are not followed, so a
 *     public host cannot bounce us to an internal one.
 *  3. Images only. A non-image response is refused, so the endpoint cannot be
 *     used to read back internal pages.
 */

import { lookup } from 'dns/promises'
import { isIP } from 'net'
import { NextRequest, NextResponse } from 'next/server'

// dns/net need the Node.js runtime, not Edge.
export const runtime = 'nodejs'

const ALLOWED_PROTOCOLS = ['https:', 'http:']
const MAX_BYTES = 25 * 1024 * 1024

/** Same-origin guard: the caller must be our own page, not another site. */
function isSameOrigin(request: NextRequest): boolean {
  // Browsers stamp Sec-Fetch-Site on every fetch and it cannot be forged by a page.
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return false

  // A cross-site POST also carries an Origin; it must match this host.
  const origin = request.headers.get('origin')
  if (origin) {
    const host = request.headers.get('host')
    try {
      if (new URL(origin).host !== host) return false
    } catch {
      return false
    }
  }

  // With no Sec-Fetch-Site and no Origin (non-browser client), require the
  // same-site hint browsers send so this cannot be driven anonymously.
  if (!site && !request.headers.get('origin')) return false

  return true
}

/** True for addresses that must never be reached through this proxy. */
function isInternalAddress(address: string): boolean {
  const kind = isIP(address)

  if (kind === 4) {
    const p = address.split('.').map(Number)
    if (p.length !== 4 || p.some(n => Number.isNaN(n) || n < 0 || n > 255)) return true
    const [a, b] = p
    return (
      a === 0 || // 0.0.0.0/8
      a === 10 || // private
      a === 127 || // loopback
      (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
      (a === 169 && b === 254) || // link-local incl. cloud metadata
      (a === 172 && b >= 16 && b <= 31) || // private
      (a === 192 && b === 168) || // private
      (a === 192 && b === 0) || // 192.0.0/24 protocol assignments
      a >= 224 // multicast + reserved (224.0.0.0/4, 240.0.0.0/4, 255.*)
    )
  }

  if (kind === 6) {
    const ip = address.toLowerCase()
    // IPv4-mapped / -embedded (::ffff:a.b.c.d, ::a.b.c.d): check the IPv4 part.
    const mapped = ip.match(/(?:::ffff:)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
    if (mapped) return isInternalAddress(mapped[1])
    if (ip === '::1' || ip === '::') return true // loopback / unspecified
    const head = ip.split(':')[0]
    const group = parseInt(head || '0', 16)
    if ((group & 0xfe00) === 0xfc00) return true // fc00::/7 unique-local
    if ((group & 0xffc0) === 0xfe80) return true // fe80::/10 link-local
    if ((group & 0xff00) === 0xff00) return true // ff00::/8 multicast
    return false
  }

  // Not a literal IP — treat an unresolvable value as unsafe.
  return true
}

/** Resolve the host and reject if any address it maps to is internal. */
async function hostResolvesToInternal(hostname: string): Promise<boolean> {
  if (isIP(hostname)) return isInternalAddress(hostname)
  try {
    const records = await lookup(hostname, { all: true })
    return records.length === 0 || records.some(r => isInternalAddress(r.address))
  } catch {
    return true // cannot resolve → do not fetch
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
    if (await hostResolvesToInternal(parsed.hostname)) {
      return NextResponse.json({ error: 'Invalid host' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    let res: Response
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': 'ProductScanner/1.0' },
        redirect: 'manual', // a redirect could point back at an internal host
        signal: controller.signal
      })
    } finally {
      clearTimeout(timeout)
    }
    if (res.status >= 300 && res.status < 400) {
      return NextResponse.json({ error: 'Upstream redirected' }, { status: 502 })
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream returned ${res.status}` }, { status: 502 })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    if (!/^(image\/|application\/octet-stream)/i.test(contentType)) {
      return NextResponse.json({ error: 'Not an image' }, { status: 415 })
    }
    const declared = Number(res.headers.get('content-length') || 0)
    if (declared > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }
    const blob = await res.arrayBuffer()
    if (blob.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }
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
