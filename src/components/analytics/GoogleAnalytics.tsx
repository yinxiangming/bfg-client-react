'use client'

import { Suspense, useEffect, useRef } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { normalizeMeasurementId, trackPageView } from '@/utils/analytics'

type Props = {
  /** GA4 measurement id (`G-…`). Renders nothing when blank or malformed. */
  measurementId?: string | null
}

/**
 * Route-change page-view reporting. Split out from `<GoogleAnalytics>` because
 * `useSearchParams()` opts its whole subtree into client-side rendering; behind
 * a Suspense boundary that cost stays contained to this leaf.
 */
function PageViewTracker({ measurementId }: { measurementId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // gtag's own snippet already reports the first page view on load — sending
  // ours too would double-count the landing page.
  const skippedInitial = useRef(false)

  useEffect(() => {
    if (!skippedInitial.current) {
      skippedInitial.current = true
      return
    }
    const query = searchParams?.toString()
    trackPageView(measurementId, query ? `${pathname}?${query}` : pathname ?? '/', document.title)
  }, [measurementId, pathname, searchParams])

  return null
}

/**
 * Injects the GA4 gtag.js tag and reports a page view on every client-side
 * navigation.
 *
 * The measurement id comes from the workspace's storefront config (one
 * deployment serves many storefronts, each with its own GA4 property), with
 * `NEXT_PUBLIC_GA_MEASUREMENT_ID` as a build-time fallback for single-tenant
 * installs. No id → nothing is loaded and no request reaches Google.
 */
export default function GoogleAnalytics({ measurementId }: Props) {
  const id = normalizeMeasurementId(measurementId)
  if (!id) return null

  return (
    <>
      <Script
        id='ga4-src'
        strategy='afterInteractive'
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      />
      <Script id='ga4-init' strategy='afterInteractive'>
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', '${id}', { send_page_view: true });`}
      </Script>
      {/* Suspense keeps `useSearchParams()` from forcing the whole tree to
          client-side rendering during static generation. */}
      <Suspense fallback={null}>
        <PageViewTracker measurementId={id} />
      </Suspense>
    </>
  )
}
