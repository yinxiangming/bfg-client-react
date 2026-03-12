import { defaultNavItems } from '@/data/navItems'
import { loadExtensions, applyNavExtensions } from '@/extensions'
import AccountLayoutClient from './AccountLayoutClient'

export const metadata = {
  title: { template: 'Account - %s', default: 'Account' },
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const extensions = await loadExtensions()
  const accountNavExtensions = extensions.flatMap(e => e.accountNav || [])
  const finalNavItems = applyNavExtensions(defaultNavItems, accountNavExtensions, 100)
  const extensionIds = extensions.map(e => e.id)

  return (
    <AccountLayoutClient navItems={finalNavItems} extensionIds={extensionIds}>
      {children}
    </AccountLayoutClient>
  )
}
