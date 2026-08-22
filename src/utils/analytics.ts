/**
 * Google Analytics 4 (gtag.js) helpers.
 *
 * The tag is injected by `<GoogleAnalytics>` (src/components/analytics). Every
 * function here is a no-op when no measurement id is configured, so call sites
 * never have to guard — a workspace without GA4 simply records nothing.
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** GA4 measurement ids look like `G-XXXXXXXXXX`; reject anything else. */
export function normalizeMeasurementId(raw?: string | null): string {
  const id = (raw ?? '').trim()
  return /^G-[A-Z0-9]+$/i.test(id) ? id.toUpperCase() : ''
}

/**
 * Build-time fallback for single-tenant deployments. The per-workspace value
 * from the storefront config wins when both are set.
 */
export function getEnvMeasurementId(): string {
  return normalizeMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
}

export function isAnalyticsReady(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

/**
 * Record a page view. Called on every client-side route change — gtag only
 * fires one automatically on the initial document load, so an App Router SPA
 * would otherwise report a single view per session.
 *
 * Must be an explicit `event`, not a repeat `config`: gtag treats a second
 * `config` for an already-configured measurement id as a settings update and
 * sends nothing. Verified against the GA4 realtime report — the `config` form
 * produced no rows at all, while this one shows up within a minute.
 */
export function trackPageView(measurementId: string, url: string, title?: string): void {
  if (!isAnalyticsReady() || !measurementId) return
  window.gtag!('event', 'page_view', {
    send_to: measurementId,
    page_path: url,
    page_location: window.location.href,
    ...(title ? { page_title: title } : {}),
  })
}

/**
 * Record a custom event, e.g. `trackEvent('login', { method: 'google' })`.
 * Prefer GA4's recommended event names so the standard reports pick them up.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!isAnalyticsReady() || !name) return
  window.gtag!('event', name, params ?? {})
}
