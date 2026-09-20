'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Typography from '@mui/material/Typography'

// Component Imports
import { SettingsSection } from '@/components/admin/settings/SettingsSection'
import SettingsTabsPage, { type SettingsTab } from '@/components/admin/settings/SettingsTabsPage'

const SettingsPage = () => {
  const t = useTranslations('admin')

  // Each section is a placeholder until its own settings page is wired up; the
  // title sits in the section rail, the copy in the control column.
  const placeholder = (title: string, body: string) => (
    <SettingsSection title={title} flush>
      <Typography variant='body2' color='text.secondary'>
        {body}
      </Typography>
    </SettingsSection>
  )

  const tabs: SettingsTab[] = [
    {
      value: 'general',
      label: t('settings.rootPage.tabs.general'),
      icon: 'tabler-settings',
      content: placeholder(
        t('settings.rootPage.placeholders.generalTitle'),
        t('settings.rootPage.placeholders.generalBody')
      )
    },
    {
      value: 'web',
      label: t('settings.rootPage.tabs.web'),
      icon: 'tabler-world',
      content: placeholder(t('settings.rootPage.placeholders.webTitle'), t('settings.rootPage.placeholders.webBody'))
    },
    {
      value: 'store',
      label: t('settings.rootPage.tabs.store'),
      icon: 'tabler-building-store',
      content: placeholder(
        t('settings.rootPage.placeholders.storeTitle'),
        t('settings.rootPage.placeholders.storeBody')
      )
    },
    {
      value: 'finance',
      label: t('settings.rootPage.tabs.finance'),
      icon: 'tabler-currency-dollar',
      content: placeholder(
        t('settings.rootPage.placeholders.financeTitle'),
        t('settings.rootPage.placeholders.financeBody')
      )
    },
    {
      value: 'delivery',
      label: t('settings.rootPage.tabs.delivery'),
      icon: 'tabler-truck',
      content: placeholder(
        t('settings.rootPage.placeholders.deliveryTitle'),
        t('settings.rootPage.placeholders.deliveryBody')
      )
    },
    {
      value: 'marketing',
      label: t('settings.rootPage.tabs.marketing'),
      icon: 'tabler-speakerphone',
      content: placeholder(
        t('settings.rootPage.placeholders.marketingTitle'),
        t('settings.rootPage.placeholders.marketingBody')
      )
    }
  ]

  return (
    <SettingsTabsPage
      title={t('settings.rootPage.title')}
      subtitle={t('settings.rootPage.subtitle')}
      tabs={tabs}
      defaultTab='general'
    />
  )
}

export default SettingsPage
