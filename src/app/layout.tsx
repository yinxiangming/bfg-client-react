// Next Imports
import { headers } from 'next/headers'
import type { Metadata } from 'next'

// i18n Imports
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

// Component Imports
import ThemeProvider from '@components/theme/ThemeProvider'
import RootLayoutChrome from '@components/layout/RootLayoutChrome'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'
import GoogleOneTap from '@/components/auth/GoogleOneTap'
import { CartProvider } from '@/contexts/CartContext'
import { AppDialogProvider } from '@/contexts/AppDialogContext'

// Util Imports
import { getRequestOrigin, clampDescription, localeTag, openGraphLocale } from '@/utils/seo'
import { getStorefrontConfigForServer, getAllowedColorModes } from '@/utils/storefrontConfig'
import { getEnvMeasurementId } from '@/utils/analytics'

// Style Imports
import './globals.css'
import '@assets/iconify-icons/generated-icons.css'
import '@/styles/storefront.css'

/**
 * Root metadata is resolved per request because one deployment serves several workspace
 * domains — a static title here would brand every storefront with the same placeholder.
 * `metadataBase` must be the request origin so Next resolves relative OG/canonical URLs
 * against the customer-facing host instead of the Vercel deployment URL.
 */
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const locale = await getLocale()
  const [origin, config] = await Promise.all([
    getRequestOrigin(),
    getStorefrontConfigForServer(locale, requestHost).catch(() => null),
  ])

  const siteName = config?.site_name?.trim() || 'Web App'
  const description = clampDescription(config?.site_description) || undefined
  // Workspace favicon, when one is configured. Omitting `icons` entirely lets
  // Next fall back to the app-router icon convention, so an unset favicon keeps
  // the built-in mark rather than rendering a broken link.
  const favicon = config?.favicon?.trim()

  return {
    metadataBase: origin ? new URL(origin) : undefined,
    ...(favicon ? { icons: { icon: favicon, shortcut: favicon, apple: favicon } } : {}),
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    applicationName: siteName,
    openGraph: {
      type: 'website',
      siteName,
      title: siteName,
      description,
      locale: openGraphLocale(locale, config?.country),
      url: origin || undefined,
    },
    twitter: { card: 'summary_large_image', title: siteName, description },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    formatDetection: { telephone: false, address: false, email: false },
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const locale = await getLocale()
  const messages = await getMessages()
  const direction = 'ltr'

  // Resolve color-mode constraints from the storefront config so first paint
  // already matches the workspace's allowed_color_modes — no flash from
  // localStorage/system preference into a disallowed mode.
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const storefrontConfig = await getStorefrontConfigForServer(locale, requestHost)
  const allowedModes = getAllowedColorModes(storefrontConfig)
  const lockedMode = allowedModes.length === 1 ? allowedModes[0] : null
  const initialMode: 'system' | 'light' | 'dark' = lockedMode ?? 'system'
  const defaultSystemMode: 'light' | 'dark' = lockedMode ?? 'light'
  // Region-qualified when the workspace declares a market (e.g. 'en-NZ'), bare locale
  // otherwise. Reuses the config already fetched above.
  const htmlLang = localeTag(locale, storefrontConfig?.country)

  // Per-workspace GA4 property wins; the env var is the single-tenant fallback.
  const gaMeasurementId = storefrontConfig?.analytics?.google_analytics_id?.trim() || getEnvMeasurementId()

  const content = (
    <RootLayoutChrome defaultSystemMode={defaultSystemMode}>{children}</RootLayoutChrome>
  )

  const htmlModeAttrs = defaultSystemMode === 'dark' ? { 'data-dark': '' } : { 'data-light': '' }

  return (
    <html
      id='__next'
      lang={htmlLang}
      dir={direction}
      data-mode={defaultSystemMode}
      {...htmlModeAttrs}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before any paint to avoid an admin skin flash. Admin paths only:
            the attribute is what scopes the admin design system (see
            components/theme/adminSurface.ts), so setting it everywhere pulled
            back-office styling into the storefront. `AdminSkinProvider` takes
            over for client-side navigation, including removal on the way out. */}
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{if(location.pathname.indexOf('/admin')!==0)return;var s=localStorage.getItem('admin-skin');document.documentElement.setAttribute('data-admin-skin',(s==='compact'||s==='carbon')?s:'slate');}catch(e){document.documentElement.setAttribute('data-admin-skin','slate');}})();" }} />
        <script src='https://code.iconify.design/3/3.1.1/iconify.min.js' async></script>
      </head>
      <body className='flex is-full min-bs-full flex-auto flex-col' data-mode={defaultSystemMode} {...htmlModeAttrs}>

        <GoogleAnalytics measurementId={gaMeasurementId} />
        <GoogleOneTap />

        <NextIntlClientProvider messages={messages}>
          <ThemeProvider initialMode={initialMode}>
            <AppDialogProvider>
              <CartProvider>{content}</CartProvider>
            </AppDialogProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export default RootLayout
