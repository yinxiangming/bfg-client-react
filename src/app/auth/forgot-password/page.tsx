import { headers } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { resolveAuthPage } from '@/components/auth/themes/resolve'
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

export default async function ForgotPasswordPage() {
  const Override = await resolveAuthPage('forgot-password')
  const Component = Override ?? AuthForgotPasswordClient
  return <Component />
}
