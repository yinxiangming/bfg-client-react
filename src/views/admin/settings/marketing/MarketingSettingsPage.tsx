'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import SettingsTabsPage from '@/components/admin/settings/SettingsTabsPage'
import CampaignsTab from './CampaignsTab'
import CampaignDisplaysTab from './CampaignDisplaysTab'
import CouponsTab from './CouponsTab'
import GiftCardsTab from './GiftCardsTab'
import ReferralProgramsTab from './ReferralProgramsTab'
import MarketingSettingsTab from './MarketingSettingsTab'

const MarketingSettingsPage = () => {
  const t = useTranslations('admin')

  return (
    <SettingsTabsPage
      title={t('settings.marketing.page.title')}
      subtitle={t('settings.marketing.page.subtitle')}
      defaultTab='campaigns'
      tabs={[
        {
          value: 'campaigns',
          label: t('settings.marketing.page.tabs.campaigns'),
          icon: 'tabler-speakerphone',
          content: <CampaignsTab />
        },
        {
          value: 'promo-displays',
          label: t('settings.marketing.page.tabs.promoDisplays'),
          icon: 'tabler-photo',
          content: <CampaignDisplaysTab />
        },
        {
          value: 'coupons',
          label: t('settings.marketing.page.tabs.coupons'),
          icon: 'tabler-ticket',
          content: <CouponsTab />
        },
        {
          value: 'gift-cards',
          label: t('settings.marketing.page.tabs.giftCards'),
          icon: 'tabler-gift',
          content: <GiftCardsTab />
        },
        {
          value: 'referral',
          label: t('settings.marketing.page.tabs.referralPrograms'),
          icon: 'tabler-users',
          content: <ReferralProgramsTab />
        },
        {
          value: 'settings',
          label: t('settings.marketing.page.tabs.settings'),
          icon: 'tabler-settings',
          content: <MarketingSettingsTab />
        }
      ]}
    />
  )
}

export default MarketingSettingsPage
