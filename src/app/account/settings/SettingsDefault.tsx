'use client'

import { useTranslations } from 'next-intl'

import Settings from '@/views/account/Settings'
import { AccountPageHeader } from '@/components/account/AccountUI'

const SettingsDefault = () => {
  const t = useTranslations('account')

  return (
    <div className='acc-page'>
      <AccountPageHeader title={t('pages.settings.title')} subtitle={t('pages.settings.subtitle')} />
      <Settings />
    </div>
  )
}

export default SettingsDefault
