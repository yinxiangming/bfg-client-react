import {defineRouting} from 'next-intl/routing';

/**
 * Every locale the app ships message catalogues for (src/messages/<app>/<locale>.json).
 * Adding a locale here requires adding those files.
 */
export const ALL_LOCALES = ['en', 'zh-hans'] as const;

export type AppLocale = (typeof ALL_LOCALES)[number];

const DEFAULT_LOCALE: AppLocale = 'en';

/**
 * Locales enabled for this deployment, from `NEXT_PUBLIC_ENABLED_LOCALES` (comma-separated).
 *
 * A single-language storefront is a per-deployment choice, not a property of the library, so
 * it is configured rather than compiled in. Everything downstream — the header language
 * switcher, locale negotiation, the `lang` attribute — derives from this list, so a store
 * that sets `NEXT_PUBLIC_ENABLED_LOCALES=en` shows no language switcher and can never
 * negotiate its way into another language.
 *
 * Unset (or empty) means every locale in ALL_LOCALES, which is the previous behaviour.
 */
function resolveEnabledLocales(): readonly AppLocale[] {
  const raw = (process.env.NEXT_PUBLIC_ENABLED_LOCALES || '').trim();
  if (!raw) return ALL_LOCALES;

  const requested = raw
    .split(',')
    .map(entry => entry.trim())
    .filter((entry): entry is AppLocale => (ALL_LOCALES as readonly string[]).includes(entry));

  if (!requested.length) return ALL_LOCALES;
  // The default locale must stay available as the negotiation fallback.
  return requested.includes(DEFAULT_LOCALE) ? requested : [DEFAULT_LOCALE, ...requested];
}

export const routing = defineRouting({
  locales: resolveEnabledLocales() as unknown as AppLocale[],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'never'
});
