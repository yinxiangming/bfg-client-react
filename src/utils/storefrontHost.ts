/**
 * Normalize hostname for storefront domain checks (case, optional port, leading www).
 */
export function normalizeStorefrontHostname(host: string): string {
  let h = host.trim().toLowerCase()
  const colon = h.indexOf(':')
  if (colon !== -1) {
    h = h.slice(0, colon)
  }
  if (h.startsWith('www.')) {
    h = h.slice(4)
  }
  return h
}

/**
 * True when this request host is treated as "local dev" (skip strict domain match).
 */
export function isLocalStorefrontHost(hostDomain: string): boolean {
  const h = normalizeStorefrontHostname(hostDomain)
  if (!h) return true
  if (h === 'localhost') return true
  if (h.startsWith('127.')) return true
  if (h.startsWith('192.168.')) return true
  if (h.startsWith('10.')) return true
  if (h.startsWith('172.')) {
    const parts = h.split('.')
    const second = parseInt(parts[1] || '0', 10)
    if (second >= 16 && second <= 31) return true
  }
  return false
}
