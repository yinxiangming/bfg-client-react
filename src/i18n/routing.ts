import {defineRouting} from 'next-intl/routing';

/**
 * Enabled locales for this deployment.
 *
 * geeker.co.nz serves the New Zealand market in English only. Everything downstream —
 * the header language switcher, locale negotiation, the `lang` attribute and hreflang —
 * derives from this list, so adding 'zh-hans' back here is all that is needed to turn
 * the second language on again (the message catalogues under src/messages/ are kept).
 */
export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',
  localePrefix: 'never'
});

export type AppLocale = (typeof routing.locales)[number];

