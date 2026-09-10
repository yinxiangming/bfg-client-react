'use client'

/**
 * Dashboard block: how far through setup this workspace is.
 *
 * Renders nothing once the required checklist is complete, or once someone has
 * dismissed it. A permanent "100% — well done" tile is a tile that teaches
 * people to stop reading the dashboard.
 */

import { useLocale, useTranslations } from 'next-intl'

import Link from 'next/link'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

import type { BlockDefinition, BlockProps } from '@/views/common/blocks'
import { localised } from '@/services/onboarding'
import useOnboarding from '@/views/admin/setup/useOnboarding'

export const definition: BlockDefinition = {
  type: 'onboarding_progress',
  name: 'Setup progress',
  category: 'system',
  description: 'How much of the initial workspace setup is done. Hides itself when finished.',
  settingsSchema: {},
  defaultSettings: {},
  defaultData: {}
}

export function OnboardingProgressBlock(_props: BlockProps<Record<string, unknown>, Record<string, unknown>>) {
  const t = useTranslations('admin.setup')
  const locale = useLocale()
  const { status, loading, error } = useOnboarding()

  if (loading) return <Skeleton variant='rounded' height={140} />

  // A failed status call is not worth a red box on the dashboard — the wizard
  // page will show the error to anyone who goes looking.
  if (error || !status) return null
  if (status.complete || status.state.dismissed) return null

  const nextStep = status.steps.find(step => !step.complete)
  const nextItem = nextStep?.items.find(item => !item.done && !item.skipped && item.required)

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <Typography variant='h5'>{t('block.title')}</Typography>
          <Typography variant='h5' color='primary.main' sx={{ ml: 'auto' }}>
            {status.percent}%
          </Typography>
        </Box>

        <LinearProgress variant='determinate' value={status.percent} sx={{ height: 6, borderRadius: 3 }} />

        <Typography variant='body2' color='text.secondary'>
          {nextItem
            ? t('block.next', { item: localised(nextItem, 'label', locale) })
            : t('block.remaining', { count: status.required_total - status.required_done })}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant='contained' size='small' component={Link} href='/admin/setup'>
            {t('block.continue')}
          </Button>
          {nextItem && (
            <Button size='small' color='secondary' component={Link} href={nextItem.href}>
              {t('go')}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default OnboardingProgressBlock
