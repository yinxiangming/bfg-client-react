'use client'

import { useTranslations } from 'next-intl'

import Payments from '@/views/account/Payments'
import { AccountPageHeader } from '@/components/account/AccountUI'

const PaymentsDefault = () => {
  const t = useTranslations('account')

  return (
    <div className='acc-page'>
      <AccountPageHeader title={t('pages.payments.title')} subtitle={t('pages.payments.subtitle')} />
      <Payments />
    </div>
  )
}

export default PaymentsDefault
