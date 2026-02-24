'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// Component Imports
import CustomTabList from '@/components/ui/TabList'
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

const tabPanelSx = {
  p: 0,
  height: '100%',
  backgroundColor: 'background.paper',
  '& .MuiBox-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  '& .MuiCard-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxShadow: 'none' }
}

const WebSettingsPage = () => {
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState('sites')
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  const handleTabChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <div>
          <Typography variant='h4' sx={{ mb: 1 }}>
            {t('settings.web.page.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.web.page.subtitle')}
          </Typography>
        </div>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card
          sx={{
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            overflow: 'hidden',
            '& .MuiCardContent-root:last-child': {
              paddingBottom: 0
            }
          }}
        >
          <TabContext value={activeTab}>
            <Grid container sx={{ minHeight: '600px', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              <Grid
                size={{ xs: 12, md: false }}
                sx={{
                  width: { md: '240px' },
                  minWidth: { md: '240px' },
                  maxWidth: { md: '240px' },
                  flexShrink: 0
                }}
              >
                <CardContent
                  sx={{
                    borderRight: { md: '1px solid' },
                    borderBottom: { xs: '1px solid', md: 'none' },
                    borderColor: 'divider',
                    minHeight: '100%',
                    pb: { xs: 2, md: 3 },
                    pr: { md: 2 }
                  }}
                >
                  <CustomTabList
                    onChange={handleTabChange}
                    orientation={isMdUp ? 'vertical' : 'horizontal'}
                    pill='true'
                    sx={{
                      borderRight: 0,
                      '& .MuiTab-root': {
                        justifyContent: 'flex-start',
                        textAlign: 'left'
                      }
                    }}
                  >
                    <Tab label={t('settings.web.page.tabs.sites')} icon={<i className='tabler-world' />} iconPosition='start' value='sites' />
                    <Tab label={t('settings.web.page.tabs.themes')} icon={<i className='tabler-palette' />} iconPosition='start' value='themes' />
                    <Tab label={t('settings.web.page.tabs.languages')} icon={<i className='tabler-language' />} iconPosition='start' value='languages' />
                    <Tab label={t('settings.web.page.tabs.pages')} icon={<i className='tabler-file-text' />} iconPosition='start' value='pages' />
                    <Tab label={t('settings.web.page.tabs.posts')} icon={<i className='tabler-news' />} iconPosition='start' value='posts' />
                    <Tab label={t('settings.web.page.tabs.categories')} icon={<i className='tabler-folders' />} iconPosition='start' value='categories' />
                    <Tab label={t('settings.web.page.tabs.tags')} icon={<i className='tabler-tag' />} iconPosition='start' value='tags' />
                    <Tab label={t('settings.web.page.tabs.menus')} icon={<i className='tabler-menu-2' />} iconPosition='start' value='menus' />
                    <Tab label={t('settings.web.page.tabs.media')} icon={<i className='tabler-photo' />} iconPosition='start' value='media' />
                    <Tab label={t('settings.web.page.tabs.newsletter')} icon={<i className='tabler-mail' />} iconPosition='start' value='newsletter' />
                    <Tab label={t('settings.web.page.tabs.settings')} icon={<i className='tabler-settings' />} iconPosition='start' value='settings' />
                  </CustomTabList>
                </CardContent>
              </Grid>

              <Grid
                size={{ xs: 12, md: false }}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'background.paper'
                }}
              >
                <TabPanel value='sites' sx={tabPanelSx}>
                  <SitesTab />
                </TabPanel>
                <TabPanel value='themes' sx={tabPanelSx}>
                  <ThemesTab />
                </TabPanel>
                <TabPanel value='languages' sx={tabPanelSx}>
                  <LanguagesTab />
                </TabPanel>
                <TabPanel value='pages' sx={tabPanelSx}>
                  <PagesTab />
                </TabPanel>
                <TabPanel value='posts' sx={tabPanelSx}>
                  <PostsTab />
                </TabPanel>
                <TabPanel value='categories' sx={tabPanelSx}>
                  <CategoriesTab />
                </TabPanel>
                <TabPanel value='tags' sx={tabPanelSx}>
                  <TagsTab />
                </TabPanel>
                <TabPanel value='menus' sx={tabPanelSx}>
                  <MenusTab />
                </TabPanel>
                <TabPanel value='media' sx={tabPanelSx}>
                  <MediaTab />
                </TabPanel>
                <TabPanel value='newsletter' sx={tabPanelSx}>
                  <NewsletterTab />
                </TabPanel>
                <TabPanel value='settings' sx={tabPanelSx}>
                  <WebSettingsTab />
                </TabPanel>
              </Grid>
            </Grid>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default WebSettingsPage

