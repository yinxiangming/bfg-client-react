'use client'

import NextLink from 'next/link'
import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'

import { useStaffMemberContext } from '@/contexts/StaffMemberContext'

/**
 * Says, on every back-office page, that this workspace can currently only be read.
 *
 * Deliberately not dismissable. The alternative to reading it here is learning it
 * from a save that fails, and a notice someone closed on Monday cannot explain
 * Thursday's refusal. It sits in the page flow rather than over it: it hides nothing,
 * and everything underneath still works — reading, filtering and exporting are all
 * unaffected by the state it describes.
 *
 * Renders nothing at all in the ordinary case, which is every workspace whose plan is
 * current and every deployment that does not use the feature.
 */
export default function WorkspaceReadOnlyBanner() {
  const t = useTranslations('admin.workspaceReadOnly')
  const { workspaceReadOnly } = useStaffMemberContext()

  if (!workspaceReadOnly) return null

  return (
    <Alert
      severity='warning'
      variant='outlined'
      icon={<i className='tabler-lock' />}
      sx={{ mb: 4, alignItems: 'center' }}
      action={
        <Button component={NextLink} href='/workspaces/billing' color='inherit' size='small' variant='outlined'>
          {t('action')}
        </Button>
      }
    >
      <AlertTitle sx={{ mb: 0.5 }}>{t('title')}</AlertTitle>
      {t('body')}
    </Alert>
  )
}
