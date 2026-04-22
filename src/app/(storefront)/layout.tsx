import React from 'react'
// Server: load extensions; use plugin storefront layout if provided, else home __root__ override or theme-based layout
import { headers } from 'next/headers'
// Website theme block styles (hero, sections). Load for storefront so CMS home blocks are styled when theme=website.
import '@/components/storefront/themes/website/website-theme-blocks.css'
import { getLocale } from 'next-intl/server'
import { StorefrontConfigProvider } from '@/contexts/StorefrontConfigContext'
import ThemeShell from '@/components/storefront/ThemeShell'
import { getStorefrontConfigForServer } from '@/utils/storefrontConfig'
import { loadExtensions } from '@/extensions'
import { ExtensionLoaderProvider } from '@/extensions/context'
import { getPageSlotReplacements, getStorefrontLayoutOverride } from '@/extensions/resolve'
import { ROOT_SLOT_ID } from '@/extensions/terminology'
import { redirect } from 'next/navigation'
import { isLocalStorefrontHost, normalizeStorefrontHostname } from '@/utils/storefrontHost'

export default async function StorefrontLayoutWrapper({ children }: { children: React.ReactNode }) {
  const extensions = await loadExtensions()
  const extensionIds = extensions.map((e) => e.id)

  const CustomStorefrontLayout = getStorefrontLayoutOverride(extensions)
  if (CustomStorefrontLayout) {
    const locale = await getLocale()
    return (
      <ExtensionLoaderProvider extensionIds={extensionIds}>
        {React.createElement(CustomStorefrontLayout, { locale, children })}
      </ExtensionLoaderProvider>
    )
  }

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isStorefrontRoot = pathname === '/' || pathname === ''
  const replacements = isStorefrontRoot ? getPageSlotReplacements(extensions, 'storefront/home') : new Map()
  const rootReplace = isStorefrontRoot ? replacements.get(ROOT_SLOT_ID) : null
  const HomeOverride = rootReplace?.component as React.ComponentType<{ locale?: string; children?: React.ReactNode }> | undefined

  if (HomeOverride) {
    const locale = await getLocale()
    return (
      <ExtensionLoaderProvider extensionIds={extensionIds}>
        <div className='flex min-bs-screen flex-col'>
          <main className='flex-1'>{React.createElement(HomeOverride, { locale, children })}</main>
        </div>
      </ExtensionLoaderProvider>
    )
  }

  const locale = await getLocale()
  const requestHost = headersList.get('host') ?? undefined
  const config = await getStorefrontConfigForServer(locale, requestHost)
  const hostDomain = (requestHost ?? '').split(':')[0]
  const workspaceDomainRaw = (config?.workspace_domain ?? '').trim()
  const isLocal = isLocalStorefrontHost(hostDomain)
  // Non-local hosts: only block when API reports a canonical storefront host and it disagrees with the browser host
  // (after normalizing case / www). Empty workspace_domain does not force /unknown — backend resolved workspace
  // via hostname / X-Forwarded-Host on WorkspaceDomain (same as account/admin).
  const hostNorm = normalizeStorefrontHostname(hostDomain)
  const wsNorm = workspaceDomainRaw ? normalizeStorefrontHostname(workspaceDomainRaw) : ''
  const domainMismatch = !isLocal && wsNorm !== '' && hostNorm !== wsNorm
  if (config === null || domainMismatch) {
    redirect('/unknown')
  }
  const theme = config.theme ?? 'store'

  return (
    <ExtensionLoaderProvider extensionIds={extensionIds}>
      <StorefrontConfigProvider initialConfig={config}>
        <ThemeShell theme={theme}>{children}</ThemeShell>
      </StorefrontConfigProvider>
    </ExtensionLoaderProvider>
  )
}
