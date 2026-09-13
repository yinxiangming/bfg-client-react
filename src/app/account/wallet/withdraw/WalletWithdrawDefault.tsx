'use client'

import { useTranslations } from 'next-intl'

import WalletWithdraw from '@/views/account/WalletWithdraw'
import { AccountPageHeader } from '@/components/account/AccountUI'

export default function WalletWithdrawDefault() {
  const t = useTranslations('account')

  return (
    <div className='acc-page'>
      <AccountPageHeader
        back={{ href: '/account', label: t('nav.dashboard') }}
        title={t('pages.wallet.withdraw.title')}
        subtitle={t('pages.wallet.withdraw.subtitle')}
      />
      <WalletWithdraw />
    </div>
  )
}
