/**
 * Which deployments search engines are allowed to index.
 *
 * Kept out of utils/seo.ts because the proxy (edge middleware) needs it too and
 * cannot import `next/headers`.
 */

/**
 * True only for the deployment that is meant to rank.
 *
 * Every deployment serves the same catalogue and canonicalises to its own host, so
 * a crawlable preview is not a copy of the store — it is a second store competing
 * with the real one for the same queries. Two hosts do this today: the UAT alias on
 * a preview deployment, and the project's `*.vercel.app` alias, which points at
 * production and would otherwise be indexed alongside the custom domain.
 *
 * `VERCEL_ENV` is unset outside Vercel, where the deployment is assumed to be the
 * real one — a self-hosted install must not silently de-index itself.
 *
 * This leans on UAT only ever being a preview deployment, which deploy-client.yml
 * enforces by forcing `alias_uat=false` on production targets. Aliasing a UAT
 * hostname onto a production deployment would make it indexable again, so that
 * rule in the workflow is load-bearing for SEO, not just for tidiness.
 *
 * Deliberately not keyed off `NEXT_PUBLIC_SITE_URL`: utils/seo.ts pins the public
 * origin to the incoming request host precisely because one deployment can serve
 * several workspace domains, and a build-time host would break that.
 */
export function isIndexableHost(host: string | null | undefined): boolean {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return false
  const hostname = (host ?? '').trim().toLowerCase().split(':')[0]
  return !hostname.endsWith('.vercel.app')
}
