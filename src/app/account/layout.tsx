import { defaultNavItems } from '@/data/navItems'
import { loadExtensions, applyNavExtensions } from '@/extensions'
import { resolveAccountSkin } from '@/components/account/themes/resolve'
import AccountLayoutClient from './AccountLayoutClient'

export const metadata = {
  title: { template: 'Account - %s', default: 'Account' },
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const extensions = await loadExtensions()
  const accountNavExtensions = extensions.flatMap(e => e.accountNav || [])
  const finalNavItems = applyNavExtensions(defaultNavItems, accountNavExtensions, 100)
  const extensionIds = extensions.map(e => e.id)

  const skin = await resolveAccountSkin()
  if (skin?.Layout) {
    const SkinLayout = skin.Layout
    return (
      <SkinLayout navItems={finalNavItems} extensionIds={extensionIds}>
        {children}
      </SkinLayout>
    )
  }

  return (
    <AccountLayoutClient navItems={finalNavItems} extensionIds={extensionIds}>
      {children}
    </AccountLayoutClient>
  )
}
