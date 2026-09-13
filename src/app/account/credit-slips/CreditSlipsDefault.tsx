'use client'

import { useTranslations } from 'next-intl'

import { AccountCard, AccountEmpty, AccountPageHeader } from '@/components/account/AccountUI'

const CreditSlipsDefault = () => {
  const t = useTranslations('account')

  return (
    <div className='acc-page'>
      <AccountPageHeader title={t('pages.creditSlips.title')} subtitle={t('pages.creditSlips.subtitle')} />
      <AccountCard>
        <AccountEmpty icon='tabler-receipt' title={t('pages.creditSlips.empty')} />
      </AccountCard>
    </div>
  )
}

export default CreditSlipsDefault
