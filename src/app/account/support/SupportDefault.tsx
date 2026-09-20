'use client'

import { Suspense } from 'react'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import Button from '@mui/material/Button'

import Icon from '@components/Icon'
import Support from '@/views/account/Support'
import { AccountLoading, AccountPageHeader } from '@/components/account/AccountUI'

const SupportDefault = () => {
  const t = useTranslations('account')

  return (
    <div className='acc-page'>
      <AccountPageHeader
        title={t('pages.support.title')}
        subtitle={t('pages.support.subtitle')}
        actions={
          <Button variant='contained' component={Link} href='/account/support?new=1' startIcon={<Icon icon='tabler-plus' />}>
            {t('support.newTicket')}
          </Button>
        }
      />
      <Suspense fallback={<AccountLoading />}>
        <Support />
      </Suspense>
    </div>
  )
}

export default SupportDefault
