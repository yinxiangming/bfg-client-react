'use client'

/**
 * The numbers the whole deployment is billed by, for the people who run it.
 *
 * Three panels rather than three pages: variables, prices and rates are read
 * together far more often than separately — a margin is changed because a
 * vendor put its price up, and a rate is entered because a bill could not be
 * converted — and the console's tree has one node for all of this, which is
 * what a reader was shown while it was still to come. The rail keeps each panel
 * one click away and the tab is in the URL, so a link goes to the one meant.
 *
 * Only a platform administrator reaches any of it. Whether the account is one is
 * the console's own answer, from the request that builds the tree, so this page
 * and the nav cannot disagree; anyone else is told plainly rather than shown
 * three panels the server would refuse.
 */

import { useTranslations } from 'next-intl'

import Alert from '@mui/material/Alert'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'

import SettingsTabsPage from '@/components/admin/settings/SettingsTabsPage'

import { usePlatformAdmin } from '../usePlatformAdmin'
import ExchangeRatesTab from './ExchangeRatesTab'
import MeterPricesTab from './MeterPricesTab'
import PlatformVariablesTab from './PlatformVariablesTab'

export default function PlatformSettingsPage() {
  const t = useTranslations('admin.console.platform')
  const { ready, failed, isPlatformAdmin } = usePlatformAdmin()

  if (failed) return <Alert severity='error'>{t('loadFailed')}</Alert>

  if (!ready) {
    return (
      <Card sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={28} aria-label={t('loading')} />
      </Card>
    )
  }

  if (!isPlatformAdmin) return <Alert severity='info'>{t('errors.platform_admin_required')}</Alert>

  return (
    <SettingsTabsPage
      title={t('title')}
      subtitle={t('subtitle')}
      defaultTab='variables'
      tabs={[
        {
          value: 'variables',
          label: t('tabs.variables'),
          icon: 'tabler-adjustments',
          content: <PlatformVariablesTab />
        },
        {
          value: 'prices',
          label: t('tabs.prices'),
          icon: 'tabler-tag',
          content: <MeterPricesTab />
        },
        {
          value: 'rates',
          label: t('tabs.rates'),
          icon: 'tabler-currency-dollar',
          content: <ExchangeRatesTab />
        }
      ]}
    />
  )
}
