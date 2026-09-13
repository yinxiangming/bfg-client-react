'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'

import Button from '@mui/material/Button'

import Icon from '@components/Icon'
import Addresses from '@/views/account/Addresses'
import { AccountPageHeader } from '@/components/account/AccountUI'
import { usePageSections } from '@/extensions/hooks/usePageSections'

const AddressesDefault = () => {
  const t = useTranslations('account.addresses')
  const openDialogRef = useRef<(() => void) | null>(null)
  const { beforeSections, afterSections } = usePageSections('account/addresses')

  return (
    <div className='acc-page'>
      {beforeSections.map(ext => ext.component && <ext.component key={ext.id} />)}
      <AccountPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button variant='contained' startIcon={<Icon icon='tabler-plus' />} onClick={() => openDialogRef.current?.()}>
            {t('addAddress')}
          </Button>
        }
      />
      <Addresses registerOpenHandler={fn => (openDialogRef.current = fn)} />
      {afterSections.map(ext => ext.component && <ext.component key={ext.id} />)}
    </div>
  )
}

export default AddressesDefault
