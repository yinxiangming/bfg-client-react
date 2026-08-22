/**
 * Guest cart identity.
 *
 * The storefront and the API sit on different registrable domains
 * (geeker.co.nz vs api.surlex.co.nz), which makes Django's `sessionid` cookie
 * cross-site. SameSite=Lax means the browser never sends it back on a `fetch()`,
 * so the API greets every request as a brand-new visitor and hands it a brand-new
 * empty cart. The visible symptom is a cart that lists its items (those come from
 * the add-to-cart response held in React state) while Order Summary totals $0.00 —
 * and a page refresh empties the cart outright.
 *
 * So guests carry their own key instead of relying on the cookie. The API already
 * accepts `X-Bfg-Cart-Session` as a cart identity (see
 * StorefrontCartViewSet._get_or_create_cart), and being cookie-independent it also
 * survives Safari ITP and third-party-cookie blocking, which a SameSite=None cookie
 * would not.
 *
 * The key is a bearer credential: anyone holding it holds that cart. It must stay
 * unguessable, hence CSPRNG-only below.
 */

const STORAGE_KEY = 'bfg_guest_cart_session'

function generateKey(): string | null {
  if (typeof crypto === 'undefined') return null
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  if (typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  // No CSPRNG: fall through to the cookie-based cart rather than mint a guessable
  // key. That cart is broken cross-site, but a predictable key is worse than broken.
  return null
}

/**
 * The current guest cart key, creating and persisting one on first use.
 *
 * Returns null when there is nowhere to keep it (SSR, or storage blocked by
 * private-browsing quotas), in which case callers simply omit the header.
 */
export function getOrCreateGuestCartKey(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) return existing

    const created = generateKey()
    if (!created) return null

    window.localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    // Safari private mode throws on setItem once the quota is zero.
    return null
  }
}

/** Forget this browser's guest cart — used when signing out. */
export function clearGuestCartKey(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do — an unreadable store has no key to forget.
  }
}
