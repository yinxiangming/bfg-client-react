// Next
import { headers } from 'next/headers'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// i18n Imports
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

// Component Imports
import ThemeProvider from '@components/theme/ThemeProvider'
import BlankLayout from '@components/layout/BlankLayout'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { CartProvider } from '@/contexts/CartContext'
import { AppDialogProvider } from '@/contexts/AppDialogContext'

// Style Imports
import './globals.css'
import '@assets/iconify-icons/generated-icons.css'
import '@/styles/storefront.css'

export const metadata = {
  title: { default: 'BFG', template: '%s' },
  description: 'Generic Web Application',
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
  const defaultSystemMode: 'light' | 'dark' = 'light'

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const useStorefrontChrome =
    pathname.startsWith('/account') || pathname.startsWith('/admin') || pathname.startsWith('/auth/')

  const content = useStorefrontChrome ? (
    <BlankLayout>
      <StorefrontLayout mode={defaultSystemMode}>{children}</StorefrontLayout>
    </BlankLayout>
  ) : (
    <BlankLayout>{children}</BlankLayout>
  )

  return (
    <html id='__next' lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <script src='https://code.iconify.design/3/3.1.1/iconify.min.js' async></script>
      </head>
      <body className='flex is-full min-bs-full flex-auto flex-col' data-mode={defaultSystemMode}>
        <InitColorSchemeScript attribute='data' defaultMode={defaultSystemMode} />
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
