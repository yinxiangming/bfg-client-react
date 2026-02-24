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
import StoresTab from './StoresTab'
import SalesChannelsTab from './SalesChannelsTab'
import SubscriptionPlansTab from './SubscriptionPlansTab'
import MessageTemplatesTab from './MessageTemplatesTab'

const tabPanelSx = {
  p: 0,
  height: '100%',
  backgroundColor: 'background.paper',
  '& .MuiBox-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  '& .MuiCard-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxShadow: 'none' }
}

const StoreSettingsPage = () => {
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState('stores')
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
            {t('settings.store.page.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.store.page.subtitle')}
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
                    <Tab label={t('settings.store.page.tabs.stores')} icon={<i className='tabler-building-warehouse' />} iconPosition='start' value='stores' />
                    <Tab label={t('settings.store.page.tabs.salesChannels')} icon={<i className='tabler-shopping-cart' />} iconPosition='start' value='channels' />
                    <Tab label={t('settings.store.page.tabs.subscriptionPlans')} icon={<i className='tabler-crown' />} iconPosition='start' value='plans' />
                    <Tab label={t('settings.store.page.tabs.messageTemplates')} icon={<i className='tabler-mail' />} iconPosition='start' value='templates' />
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
                <TabPanel value='stores' sx={tabPanelSx}>
                  <StoresTab />
                </TabPanel>
                <TabPanel value='channels' sx={tabPanelSx}>
                  <SalesChannelsTab />
                </TabPanel>
                <TabPanel value='plans' sx={tabPanelSx}>
                  <SubscriptionPlansTab />
                </TabPanel>
                <TabPanel value='templates' sx={tabPanelSx}>
                  <MessageTemplatesTab />
                </TabPanel>
              </Grid>
            </Grid>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default StoreSettingsPage

