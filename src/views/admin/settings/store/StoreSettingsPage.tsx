'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import SettingsTabsPage from '@/components/admin/settings/SettingsTabsPage'
import StoresTab from './StoresTab'
import SalesChannelsTab from './SalesChannelsTab'
import SubscriptionPlansTab from './SubscriptionPlansTab'
import MessageTemplatesTab from './MessageTemplatesTab'
import StorePluginsTab from './StorePluginsTab'

const StoreSettingsPage = () => {
  const t = useTranslations('admin')

  return (
    <SettingsTabsPage
      title={t('settings.store.page.title')}
      subtitle={t('settings.store.page.subtitle')}
      defaultTab='stores'
      tabs={[
        {
          value: 'stores',
          label: t('settings.store.page.tabs.stores'),
          icon: 'tabler-building-warehouse',
          content: <StoresTab />
        },
        {
          value: 'channels',
          label: t('settings.store.page.tabs.salesChannels'),
          icon: 'tabler-shopping-cart',
          content: <SalesChannelsTab />
        },
        {
          value: 'plans',
          label: t('settings.store.page.tabs.subscriptionPlans'),
          icon: 'tabler-crown',
          content: <SubscriptionPlansTab />
        },
        {
          value: 'templates',
          label: t('settings.store.page.tabs.messageTemplates'),
          icon: 'tabler-mail',
          content: <MessageTemplatesTab />
        },
        {
          value: 'settings',
          label: t('settings.store.page.tabs.settings'),
          icon: 'tabler-settings',
          content: <StorePluginsTab />
        }
      ]}
    />
  )
}

export default StoreSettingsPage
