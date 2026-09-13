'use client'

import { Suspense } from 'react'

import { useTranslations } from 'next-intl'

import Returns from '@/views/account/Returns'
import { AccountLoading, AccountPageHeader } from '@/components/account/AccountUI'

const ReturnsDefault = () => {
  const t = useTranslations('account')

  return (
    <div className='acc-page'>
      <AccountPageHeader title={t('returns.title')} subtitle={t('returns.subtitle')} />
      <Suspense fallback={<AccountLoading />}>
        <Returns />
      </Suspense>
    </div>
  )
}

export default ReturnsDefault
