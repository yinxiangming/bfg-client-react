'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import Button from '@mui/material/Button'

import Icon from '@components/Icon'
import { AccountCard, AccountPageHeader } from '@/components/account/AccountUI'

/**
 * Personal data requests. Export and deletion are handled by the shop on request,
 * so this page routes the request to customer support rather than offering buttons
 * that do nothing.
 */
const GdprDefault = () => {
  const t = useTranslations('account')

  return (
    <div className='acc-page'>
      <AccountPageHeader title={t('pages.privacy.title')} subtitle={t('pages.privacy.subtitle')} />
      <AccountCard title={t('settings.dataCard.title')}>
        <div className='acc-row'>
          <span className='acc-ico acc-ico--sm acc-ico--neu'>
            <Icon icon='tabler-database' />
          </span>
          <div className='acc-grow'>
            <div className='acc-medium'>{t('settings.dataCard.request')}</div>
            <div className='acc-sub'>{t('settings.dataCard.requestHint')}</div>
          </div>
          <Button size='small' variant='outlined' component={Link} href='/account/support?topic=data'>
            {t('settings.dataCard.contact')}
          </Button>
        </div>
      </AccountCard>
    </div>
  )
}

export default GdprDefault
