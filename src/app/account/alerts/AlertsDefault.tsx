'use client'

import { useEffect } from 'react'

import { useTranslations } from 'next-intl'

import Alerts from '@/views/account/Alerts'
import { AccountPageHeader } from '@/components/account/AccountUI'
import { useAccount } from '@/contexts/AccountContext'

const AlertsDefault = () => {
  const t = useTranslations('account')
  const { refreshStats } = useAccount()

  // Reading messages here changes the unread count the sidebar and topbar show.
  useEffect(() => () => void refreshStats(), [refreshStats])

  return (
    <div className='acc-page'>
      <AccountPageHeader title={t('pages.inbox.title')} subtitle={t('pages.inbox.subtitle')} />
      <Alerts />
    </div>
  )
}

export default AlertsDefault
