// Server Component - metadata, skin fonts and the site config the topbar brands itself with
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'

import AdminSkinFonts from '@/components/theme/AdminSkinFonts'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'

import WorkspacesLayoutClient from './WorkspacesLayoutClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.workspaces')

  return {
    title: t('title'),
    // Per-user page behind sign-in: never index it, and don't follow links out of it.
    robots: { index: false, follow: false, nocache: true },
  }
}

/**
 * /workspaces is where a user picks one of their workspaces, so unlike /admin it cannot
 * depend on one: no staff check and no admin navigation, only a signed-in user.
 */
export default async function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const requestHost = (await headers()).get('host') ?? undefined
  // The root layout already made this call; getStorefrontConfigForServer is cached per request.
  const config = await getStorefrontConfigForServer(locale, requestHost)

  return (
    <>
      <AdminSkinFonts />
      <StorefrontConfigProvider initialConfig={config}>
        <WorkspacesLayoutClient>{children}</WorkspacesLayoutClient>
      </StorefrontConfigProvider>
    </>
  )
}
