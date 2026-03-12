import { headers } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import AuthForgotPasswordClient from './AuthForgotPasswordClient'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const headersList = await headers()
  const requestHost = headersList.get('host') ?? undefined
  const [config, t] = await Promise.all([
    getStorefrontConfigForServer(locale, requestHost),
    getTranslations('auth.forgotPassword')
  ])
  const siteName = config?.site_name?.trim() || 'BFG'
  return { title: `${siteName} - ${t('pageTitle')}` }
}

export default function ForgotPasswordPage() {
  return <AuthForgotPasswordClient />
}
