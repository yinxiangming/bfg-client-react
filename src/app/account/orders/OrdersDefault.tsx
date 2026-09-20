'use client'

import { Suspense } from 'react'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import Button from '@mui/material/Button'

import Icon from '@components/Icon'
import Orders from '@/views/account/Orders'
import { AccountLoading, AccountPageHeader } from '@/components/account/AccountUI'
import { usePageSections } from '@/extensions/hooks/usePageSections'

const OrdersDefault = () => {
  const t = useTranslations('account')
  const { beforeSections, afterSections } = usePageSections('account/orders')

  return (
    <div className='acc-page'>
      {beforeSections.map(ext => ext.component && <ext.component key={ext.id} />)}
      <AccountPageHeader
        title={t('pages.orders.title')}
        subtitle={t('pages.orders.subtitle')}
        actions={
          <Button
            variant='outlined'
            component={Link}
            href='/account/returns'
            startIcon={<Icon icon='tabler-arrow-back-up' />}
          >
            {t('actions.startReturn')}
          </Button>
        }
      />
      <Suspense fallback={<AccountLoading />}>
        <Orders />
      </Suspense>
      {afterSections.map(ext => ext.component && <ext.component key={ext.id} />)}
    </div>
  )
}

export default OrdersDefault
