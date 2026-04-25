import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh-hans'],
  defaultLocale: 'en',
  localePrefix: 'never'
});

export type AppLocale = (typeof routing.locales)[number];

