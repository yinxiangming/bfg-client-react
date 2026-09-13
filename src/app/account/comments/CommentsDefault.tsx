'use client'

import { useTranslations } from 'next-intl'

import { AccountCard, AccountEmpty, AccountPageHeader } from '@/components/account/AccountUI'

const CommentsDefault = () => {
  const t = useTranslations('account')

  return (
    <div className='acc-page'>
      <AccountPageHeader title={t('pages.comments.title')} subtitle={t('pages.comments.subtitle')} />
      <AccountCard>
        <AccountEmpty icon='tabler-message-2' title={t('pages.comments.empty')} />
      </AccountCard>
    </div>
  )
}

export default CommentsDefault
