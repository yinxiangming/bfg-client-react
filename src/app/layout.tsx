// Next Imports
import { headers } from 'next/headers'
import type { Metadata } from 'next'

// i18n Imports
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

// Component Imports
import ThemeProvider from '@components/theme/ThemeProvider'
import RootLayoutChrome from '@components/layout/RootLayoutChrome'
import { CartProvider } from '@/contexts/CartContext'
import { AppDialogProvider } from '@/contexts/AppDialogContext'

// Util Imports
import { getRequestOrigin, clampDescription } from '@/utils/seo'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'

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

  return {
    metadataBase: origin ? new URL(origin) : undefined,
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    applicationName: siteName,
    openGraph: {
      type: 'website',
      siteName,
      title: siteName,
      description,
      locale: locale === 'zh-hans' ? 'zh_CN' : 'en_NZ',
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

const getInitialMode = async (): Promise<'system' | 'light' | 'dark'> => {
  // Try to get stored mode from cookies or default to 'system'
  // This runs on server, so we can't access localStorage
  return 'system'
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const initialMode = await getInitialMode()
  const locale = await getLocale()
  const messages = await getMessages()
  const direction = 'ltr'
  // Region-qualified language tag: 'en-NZ' tells search engines which market this store serves.
  const htmlLang = locale === 'zh-hans' ? 'zh-Hans' : 'en-NZ'
  const defaultSystemMode: 'light' | 'dark' = 'light'

  const content = (
    <RootLayoutChrome defaultSystemMode={defaultSystemMode}>{children}</RootLayoutChrome>
  )

  return (
    <html id='__next' lang={htmlLang} dir={direction} data-light='' suppressHydrationWarning>
      <head>
        <script src='https://code.iconify.design/3/3.1.1/iconify.min.js' async></script>
      </head>
      <body className='flex is-full min-bs-full flex-auto flex-col' data-mode={defaultSystemMode} data-light=''>

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
