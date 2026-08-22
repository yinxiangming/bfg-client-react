'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import SettingsTabsPage from '@/components/admin/settings/SettingsTabsPage'
import SupportSettingsTab from './SupportSettingsTab'
import CategoriesTab from './CategoriesTab'
import PrioritiesTab from './PrioritiesTab'

const SupportSettingsPage = () => {
  const t = useTranslations('admin')

  return (
    <SettingsTabsPage
      title={t('settings.support.page.title')}
      subtitle={t('settings.support.page.subtitle')}
      defaultTab='settings'
      tabs={[
        {
          value: 'settings',
          label: t('settings.support.page.tabs.settings'),
          icon: 'tabler-settings',
          content: <SupportSettingsTab />
        },
        {
          value: 'categories',
          label: t('settings.support.page.tabs.categories'),
          icon: 'tabler-folders',
          content: <CategoriesTab />
        },
        {
          value: 'priorities',
          label: t('settings.support.page.tabs.priorities'),
          icon: 'tabler-flag',
          content: <PrioritiesTab />
        }
      ]}
    />
  )
}

export default SupportSettingsPage
