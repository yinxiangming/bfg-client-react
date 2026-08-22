/**
 * Canonical path for a product link.
 *
 * `/product/<id>` and `/product/<slug>` serve identical content, but the product
 * page canonicalises to the slug — it carries the keywords and it is the form the
 * sitemap lists. Linking by id therefore pointed every internal link at a
 * non-canonical URL while leaving the canonical one with no inbound links at all,
 * so search engines saw 55 orphaned product pages that only the sitemap mentioned.
 *
 * Falls back to the id when a product has no slug, which keeps the link working
 * rather than producing `/product/undefined`.
 */
export function productPath(product: { id: number | string; slug?: string | null }): string {
  const handle = (typeof product.slug === 'string' && product.slug.trim()) || product.id
  return `/product/${handle}`
}
