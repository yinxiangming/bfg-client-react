// i18n Imports
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { headers } from 'next/headers'

// Component Imports
import ThemeProvider from '@components/theme/ThemeProvider'
import RootLayoutChrome from '@components/layout/RootLayoutChrome'
import { CartProvider } from '@/contexts/CartContext'
import { AppDialogProvider } from '@/contexts/AppDialogContext'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { getAllowedColorModes } from '@/utils/storefrontConfig'

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

  const content = (
    <RootLayoutChrome defaultSystemMode={defaultSystemMode}>{children}</RootLayoutChrome>
  )

  const htmlModeAttrs = defaultSystemMode === 'dark' ? { 'data-dark': '' } : { 'data-light': '' }

  return (
    <html
      id='__next'
      lang={locale}
      dir={direction}
      data-mode={defaultSystemMode}
      {...htmlModeAttrs}
      suppressHydrationWarning
    >
      <head>
        <script src='https://code.iconify.design/3/3.1.1/iconify.min.js' async></script>
      </head>
      <body className='flex is-full min-bs-full flex-auto flex-col' data-mode={defaultSystemMode} {...htmlModeAttrs}>

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
