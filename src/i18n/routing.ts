import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh-hans'],
  defaultLocale: 'zh-hans',
  localePrefix: 'never'
});

export type AppLocale = (typeof routing.locales)[number];

