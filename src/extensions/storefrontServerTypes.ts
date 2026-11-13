import type { MetadataRoute } from 'next'
import type { StorefrontConfig } from '@/utils/storefrontConfig'

export type StorefrontServerContext = {
  config: StorefrontConfig | null
  locale: string
  requestHost?: string
  origin: string
  pageData?: unknown
}
export type StorefrontImage = { url: string; alt?: string }
export type StorefrontRouteDecision = { redirect?: string; notFound?: boolean }
export type StorefrontCmsPresentation = StorefrontRouteDecision & {
  images?: StorefrontImage[]
  breadcrumbs?: Array<{ name: string; path: string }>
}

/** Optional server-only contributions; business catalogues stay in their plugin. */
export interface StorefrontServerProvider {
  matches(config: StorefrontConfig | null): boolean
  homeImages?(context: StorefrontServerContext): StorefrontImage[] | undefined
  organizationJsonLd?(context: StorefrontServerContext): Record<string, unknown> | undefined
  cmsPresentation?(slug: string, context: StorefrontServerContext): StorefrontCmsPresentation | undefined
  legacyRoute?(kind: string, identifier: string, context: StorefrontServerContext): StorefrontRouteDecision | undefined | Promise<StorefrontRouteDecision | undefined>
  sitemap?(context: StorefrontServerContext): Promise<{ includeCatalogue?: boolean; replaceDefaults?: boolean; entries: MetadataRoute.Sitemap }>
}
