import {defineRouting} from 'next-intl/routing';
import {APP_LOCALES, DEFAULT_APP_LOCALE} from './locales'

export const routing = defineRouting({
  locales: APP_LOCALES,
  defaultLocale: DEFAULT_APP_LOCALE,
  localePrefix: 'never'
});

export type AppLocale = (typeof routing.locales)[number];
