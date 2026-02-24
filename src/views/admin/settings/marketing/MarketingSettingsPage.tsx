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
import CampaignsTab from './CampaignsTab'
import CampaignDisplaysTab from './CampaignDisplaysTab'
import CouponsTab from './CouponsTab'
import GiftCardsTab from './GiftCardsTab'
import ReferralProgramsTab from './ReferralProgramsTab'
import MarketingSettingsTab from './MarketingSettingsTab'

const tabPanelSx = {
  p: 0,
  height: '100%',
  backgroundColor: 'background.paper',
  '& .MuiBox-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  '& .MuiCard-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxShadow: 'none' }
}

const MarketingSettingsPage = () => {
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState('campaigns')
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
            {t('settings.marketing.page.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.marketing.page.subtitle')}
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
                    <Tab label={t('settings.marketing.page.tabs.campaigns')} icon={<i className='tabler-speakerphone' />} iconPosition='start' value='campaigns' />
                    <Tab label={t('settings.marketing.page.tabs.promoDisplays')} icon={<i className='tabler-photo' />} iconPosition='start' value='promo-displays' />
                    <Tab label={t('settings.marketing.page.tabs.coupons')} icon={<i className='tabler-ticket' />} iconPosition='start' value='coupons' />
                    <Tab label={t('settings.marketing.page.tabs.giftCards')} icon={<i className='tabler-gift' />} iconPosition='start' value='gift-cards' />
                    <Tab label={t('settings.marketing.page.tabs.referralPrograms')} icon={<i className='tabler-users' />} iconPosition='start' value='referral' />
                    <Tab label={t('settings.marketing.page.tabs.settings')} icon={<i className='tabler-settings' />} iconPosition='start' value='settings' />
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
                <TabPanel value='campaigns' sx={tabPanelSx}>
                  <CampaignsTab />
                </TabPanel>
                <TabPanel value='promo-displays' sx={tabPanelSx}>
                  <CampaignDisplaysTab />
                </TabPanel>
                <TabPanel value='coupons' sx={tabPanelSx}>
                  <CouponsTab />
                </TabPanel>
                <TabPanel value='gift-cards' sx={tabPanelSx}>
                  <GiftCardsTab />
                </TabPanel>
                <TabPanel value='referral' sx={tabPanelSx}>
                  <ReferralProgramsTab />
                </TabPanel>
                <TabPanel value='settings' sx={tabPanelSx}>
                  <MarketingSettingsTab />
                </TabPanel>
              </Grid>
            </Grid>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default MarketingSettingsPage

