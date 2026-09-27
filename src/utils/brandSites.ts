import catalog from '../configs/brandSites.json' with { type: 'json' }

export type BrandSite = (typeof catalog)[keyof typeof catalog]
export type BrandSection = 'projects' | 'service' | 'parts'
export type BrandLegacyKind = 'projects' | 'services' | 'products'

const LEGACY_SECTIONS: Record<BrandLegacyKind, BrandSection> = {
  projects: 'projects',
  services: 'service',
  products: 'parts',
}

/** Brand presentation must never bleed into another workspace sharing the same skin. */
export function getBrandSite(config: { theme?: string; workspace_slug?: string } | null | undefined): BrandSite | null {
  const brand = catalog[config?.theme as keyof typeof catalog]
  return brand && config?.workspace_slug === brand.slug ? brand : null
}

export function isBrandHomeAlias(
  config: { theme?: string; workspace_slug?: string } | null | undefined,
  slug: string
): boolean {
  return slug === 'home' && getBrandSite(config) !== null
}

/** Resolve only source IDs/slugs explicitly scoped to this matched brand. */
export function getBrandLegacyPath(
  brand: BrandSite,
  kind: BrandLegacyKind,
  identifier: string
): string | undefined {
  const legacyIds = brand.legacyIds as Record<BrandLegacyKind, Record<string, string>>
  const legacySlugs = brand.legacySlugs as Record<BrandLegacyKind, Record<string, string>>
  const canonicalSlug = legacyIds[kind]?.[identifier] || legacySlugs[kind]?.[identifier]
  return canonicalSlug ? '/' + LEGACY_SECTIONS[kind] + '/' + canonicalSlug : undefined
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
  return stem ? '/brand-assets/' + assetFolder + '/' + stem + '-' + width + '.webp' : ''
}

export function brandImagePath(brand: BrandSite, source: string, width = 960): string {
  return brandImageVariantPath(brand.assetFolder, source, width)
}

/** Prefer image fields returned by the workspace; never fall back to Client catalog content. */
export function getBrandPostImage(
  post: { featured_image?: unknown; custom_fields?: unknown },
): string {
  const customFields = post.custom_fields
  const brandImage = customFields && typeof customFields === 'object'
    ? (customFields as Record<string, unknown>).brand_image
    : undefined
  if (typeof brandImage === 'string' && brandImage.trim()) return brandImage.trim()
  if (typeof post.featured_image === 'string' && post.featured_image.trim()) return post.featured_image.trim()
  return ''
}

/** Resolve the workspace post before rendering it under the matched brand skin. */
export async function fetchBrandPost<T>(
  config: { theme?: string; workspace_slug?: string } | null | undefined,
  slug: string,
  section: BrandSection,
  fetchPost: () => Promise<T | null>
): Promise<{ brand: BrandSite; post: T; path: string } | null> {
  const brand = getBrandSite(config)
  if (!brand) return null
  const post = await fetchPost()
  if (!post) return null
  const customFields = (post as T & { custom_fields?: unknown }).custom_fields
  const publicPath = customFields && typeof customFields === 'object'
    ? (customFields as Record<string, unknown>).public_path
    : undefined
  const prefix = '/' + section + '/'
  if (typeof publicPath === 'string' && publicPath.trim() && !publicPath.startsWith(prefix)) return null
  return {
    brand,
    post,
    path: typeof publicPath === 'string' && publicPath.startsWith(prefix)
      ? publicPath
      : prefix + slug,
  }
}

export function brandBusinessJsonLd(
  brand: BrandSite,
  origin: string,
  config: { site_name?: string; contact_phone?: string; contact_email?: string; default_currency?: string; country?: string } = {}
) {
  return {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': origin + '/#organization',
    name: config.site_name || brand.slug, url: origin, telephone: config.contact_phone, email: config.contact_email,
    currenciesAccepted: config.default_currency,
    address: { '@type': 'PostalAddress', addressCountry: config.country },
  }
}
