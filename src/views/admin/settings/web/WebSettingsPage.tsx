'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import SettingsTabsPage from '@/components/admin/settings/SettingsTabsPage'
import WebSettingsTab from './WebSettingsTab'
import SitesTab from './SitesTab'
import ThemesTab from './ThemesTab'
import LanguagesTab from './LanguagesTab'
import PagesTab from './PagesTab'
import PostsTab from './PostsTab'
import TagsTab from './TagsTab'
import CategoriesTab from './CategoriesTab'
import MenusTab from './MenusTab'
import MediaTab from './MediaTab'
import NewsletterTab from './NewsletterTab'

const WebSettingsPage = () => {
  const t = useTranslations('admin')

  return (
    <SettingsTabsPage
      title={t('settings.web.page.title')}
      subtitle={t('settings.web.page.subtitle')}
      defaultTab='sites'
      tabs={[
        {
          value: 'sites',
          label: t('settings.web.page.tabs.sites'),
          icon: 'tabler-world',
          content: <SitesTab />
        },
        {
          value: 'themes',
          label: t('settings.web.page.tabs.themes'),
          icon: 'tabler-palette',
          content: <ThemesTab />
        },
        {
          value: 'languages',
          label: t('settings.web.page.tabs.languages'),
          icon: 'tabler-language',
          content: <LanguagesTab />
        },
        {
          value: 'pages',
          label: t('settings.web.page.tabs.pages'),
          icon: 'tabler-file-text',
          content: <PagesTab />
        },
        {
          value: 'posts',
          label: t('settings.web.page.tabs.posts'),
          icon: 'tabler-news',
          content: <PostsTab />
        },
        {
          value: 'categories',
          label: t('settings.web.page.tabs.categories'),
          icon: 'tabler-folders',
          content: <CategoriesTab />
        },
        {
          value: 'tags',
          label: t('settings.web.page.tabs.tags'),
          icon: 'tabler-tag',
          content: <TagsTab />
        },
        {
          value: 'menus',
          label: t('settings.web.page.tabs.menus'),
          icon: 'tabler-menu-2',
          content: <MenusTab />
        },
        {
          value: 'media',
          label: t('settings.web.page.tabs.media'),
          icon: 'tabler-photo',
          content: <MediaTab />
        },
        {
          value: 'newsletter',
          label: t('settings.web.page.tabs.newsletter'),
          icon: 'tabler-mail',
          content: <NewsletterTab />
        },
        {
          value: 'settings',
          label: t('settings.web.page.tabs.settings'),
          icon: 'tabler-settings',
          content: <WebSettingsTab />
        }
      ]}
    />
  )
}

export default WebSettingsPage
