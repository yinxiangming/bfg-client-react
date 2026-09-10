'use client'

/**
 * The setup wizard.
 *
 * `manage.py init` and `provision_workspace` fill a workspace in from the
 * command line; this is the same job for the person who owns the shop. Two
 * halves: a country + industry pick that writes the boring 80% (currency, tax,
 * categories, legal pages, navigation), and a checklist of what is left, each
 * row linking at the screen that fixes it.
 */

import { useMemo } from 'react'

import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { usePageSlots } from '@/extensions/hooks/usePageSections'
import { getTargetSlot } from '@/extensions/registry'
import ChecklistStepper, { stepSlotId } from './ChecklistStepper'
import QuickStartCard from './QuickStartCard'
import useOnboarding from './useOnboarding'
import { dismissOnboarding } from '@/services/onboarding'

const SetupWizardPage = () => {
  const t = useTranslations('admin.setup')
  const { status, setStatus, loading, error } = useOnboarding()
  const { beforeSlots, afterSlots, replacements } = usePageSlots('admin/setup')

  // Two audiences for `after` slots: a plugin that wants a card at the bottom of
  // the page, and one that wants its controls inside its own step. They are told
  // apart by whether the target slot names a step.
  const stepKeys = new Set((status?.steps ?? []).map(step => stepSlotId(step.key)))
  const stepSlots = afterSlots.filter(ext => stepKeys.has(getTargetSlot(ext) ?? ''))
  const pageSlots = afterSlots.filter(ext => !stepKeys.has(getTargetSlot(ext) ?? ''))

  const remaining = useMemo(
    () => (status ? status.required_total - status.required_done : 0),
    [status]
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !status) {
    return <Alert severity='error'>{error ?? t('loadFailed')}</Alert>
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AdminPageHeader title={t('title')} subtitle={t('subtitle')} flush />
      </Grid>

      {beforeSlots.map(
        ext =>
          ext.component && (
            <Grid key={ext.id} size={{ xs: 12 }}>
              <ext.component status={status} onChange={setStatus} />
            </Grid>
          )
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 3, flexWrap: 'wrap' }}>
              <Typography variant='h3' sx={{ lineHeight: 1 }}>
                {status.percent}%
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {status.complete
                  ? t('allDone')
                  : t('remaining', { count: remaining, optional: status.optional_total - status.optional_done })}
              </Typography>
              {/* Only useful while there is still a nag to silence: the
                  dashboard block already hides itself once setup is complete. */}
              {!status.complete && !status.state.dismissed && (
                <Button
                  size='small'
                  color='secondary'
                  sx={{ ml: 'auto' }}
                  onClick={async () => setStatus(await dismissOnboarding(true))}
                >
                  {t('hideFromDashboard')}
                </Button>
              )}
            </Box>
            <LinearProgress
              variant='determinate'
              value={status.percent}
              color={status.complete ? 'success' : 'primary'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        {(() => {
          const replacement = replacements.get('QuickStart')

          return replacement?.component ? (
            <replacement.component status={status} onChange={setStatus} />
          ) : (
            <QuickStartCard status={status} onApplied={setStatus} />
          )
        })()}
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' sx={{ mb: 1 }}>
              {t('checklist.title')}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 5 }}>
              {t('checklist.subtitle')}
            </Typography>
            <ChecklistStepper status={status} onChange={setStatus} stepSlots={stepSlots} />
          </CardContent>
        </Card>
      </Grid>

      {pageSlots.map(
        ext =>
          ext.component && (
            <Grid key={ext.id} size={{ xs: 12 }}>
              <ext.component status={status} onChange={setStatus} />
            </Grid>
          )
      )}
    </Grid>
  )
}

export default SetupWizardPage
