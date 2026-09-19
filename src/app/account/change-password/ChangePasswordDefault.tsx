'use client'

import { useTranslations } from 'next-intl'

import ChangePassword from '@/views/account/ChangePassword'
import { AccountPageHeader } from '@/components/account/AccountUI'

const ChangePasswordDefault = () => {
  const t = useTranslations('account')

  return (
    <div className='acc-page'>
      <AccountPageHeader
        back={{ href: '/account/settings', label: t('nav.settings') }}
        title={t('pages.changePassword.title')}
        subtitle={t('pages.changePassword.subtitle')}
      />
      <ChangePassword />
    </div>
  )
}

export default ChangePasswordDefault
