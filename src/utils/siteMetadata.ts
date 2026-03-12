/**
 * Site metadata for document title: single source for site_name from backend.
 * Uses getStorefrontConfigForServer (no duplicate fetch). Use getSiteConfig() for title suffix.
 */

import { cache } from 'react'
import { getStorefrontConfigForServer } from './storefrontConfig'

const FALLBACK_SITE_NAME = 'Web App'

/**
 * Get site_name from storefront config. Deduped per request via getStorefrontConfigForServer cache.
 * Pass requestHost (e.g. from headers().get('host')) so backend resolves workspace by domain.
 * Use for generateMetadata / document title only. Fallback: site_name = 'Web App'.
 */
export const getSiteConfig = cache(
  async (locale?: string, requestHost?: string): Promise<{ site_name: string }> => {
    const lang = locale ?? 'en'
    const config = await getStorefrontConfigForServer(lang, requestHost)
    const site_name = (config?.site_name ?? '').trim() || FALLBACK_SITE_NAME
    return { site_name }
  }
)
