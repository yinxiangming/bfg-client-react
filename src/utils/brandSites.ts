import catalog from '../configs/brandSites.json' with { type: 'json' }

export type BrandSite = (typeof catalog)[keyof typeof catalog]
export type BrandPost = BrandSite['posts'][number]
export type BrandSection = 'projects' | 'service' | 'parts'
export type BrandLegacyKind = 'projects' | 'services' | 'products'

const LEGACY_SECTIONS: Record<BrandLegacyKind, BrandSection> = {
  projects: 'projects',
  services: 'service',
  products: 'parts',
}

/** Brand content must never bleed into another workspace sharing the same skin. */
export function getBrandSite(config: { theme?: string; workspace_slug?: string } | null | undefined): BrandSite | null {
  const brand = catalog[config?.theme as keyof typeof catalog]
  return brand && config?.workspace_slug === brand.slug ? brand : null
}

export function getBrandPostPath(brand: BrandSite, slug: string): string | undefined {
  return brand.posts.find(post => post.slug === slug)?.path
}

export function isBrandHomeAlias(
  config: { theme?: string; workspace_slug?: string } | null | undefined,
  slug: string
): boolean {
  return slug === 'home' && getBrandSite(config) !== null
}

export function getBrandPost(brand: BrandSite, slug: string, section?: BrandSection): BrandPost | undefined {
  return brand.posts.find(post => post.slug === slug && (!section || post.path.startsWith(`/${section}/`)))
}

/** Resolve only source IDs/slugs explicitly scoped to this matched brand. */
export function getBrandLegacyPath(
  brand: BrandSite,
  kind: BrandLegacyKind,
  identifier: string
): string | undefined {
  const legacyIds = brand.legacyIds as Record<BrandLegacyKind, Record<string, string>>
  const legacySlugs = brand.legacySlugs as Record<BrandLegacyKind, Record<string, string>>
  const canonicalSlug = legacyIds[kind][identifier] || legacySlugs[kind][identifier] || identifier
  return getBrandPost(brand, canonicalSlug, LEGACY_SECTIONS[kind])?.path
}

/** Preserve source basenames; only locally generated width variants lose their width suffix. */
export function brandImageStem(source: string): string {
  const path = source.split(/[?#]/, 1)[0]
  const filename = path.split('/').pop() || ''
  if (path.includes('/brand-assets/')) {
    return filename.replace(/-(?:480|960|1600)\.webp$/i, '').replace(/\.[^.]+$/, '')
  }
  return filename.replace(/\.[^.]+$/, '')
}

export function brandImageVariantPath(assetFolder: BrandSite['assetFolder'], source: string, width = 960): string {
  const stem = brandImageStem(source)
  return stem ? `/brand-assets/${assetFolder}/${stem}-${width}.webp` : ''
}

export function brandImagePath(brand: BrandSite, source: string, width = 960): string {
  return brandImageVariantPath(brand.assetFolder, source, width)
}

export function getBrandPostImage(
  post: { featured_image?: unknown; custom_fields?: unknown },
  item: Pick<BrandPost, 'image'>
): string {
  const customFields = post.custom_fields
  const brandImage = customFields && typeof customFields === 'object'
    ? (customFields as Record<string, unknown>).brand_image
    : undefined
  if (typeof brandImage === 'string' && brandImage.trim()) return brandImage.trim()
  if (typeof post.featured_image === 'string' && post.featured_image.trim()) return post.featured_image.trim()
  return item.image
}

/** Resolve the allow-listed post before calling the public rendered-post endpoint. */
export async function fetchBrandPost<T>(
  config: { theme?: string; workspace_slug?: string } | null | undefined,
  slug: string,
  section: BrandSection,
  fetchPost: () => Promise<T | null>
): Promise<{ brand: BrandSite; item: BrandPost; post: T } | null> {
  const brand = getBrandSite(config)
  const item = brand ? getBrandPost(brand, slug, section) : undefined
  if (!brand || !item) return null
  const post = await fetchPost()
  return post ? { brand, item, post } : null
}

export function brandBusinessJsonLd(brand: BrandSite, origin: string) {
  return {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': `${origin}/#organization`,
    name: brand.name, url: origin, telephone: brand.phone, email: brand.email,
    currenciesAccepted: brand.currency,
    address: { '@type': 'PostalAddress', streetAddress: brand.address, addressLocality: brand.locality, postalCode: brand.postalCode, addressCountry: brand.country },
    areaServed: { '@type': 'City', name: 'Auckland' },
  }
}
