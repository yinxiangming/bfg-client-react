'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'

// Component Imports
import CustomTabList from '@/components/ui/TabList'

const SettingsPage = () => {
  const t = useTranslations('admin')
  // States
  const [activeTab, setActiveTab] = useState('general')

  const handleTabChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  return (
    <Grid container spacing={3}>
      {/* Page Header */}
      <Grid size={{ xs: 12 }}>
        <div>
          <Typography variant='h4' sx={{ mb: 1 }}>
            {t('settings.rootPage.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.rootPage.subtitle')}
          </Typography>
        </div>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <TabContext value={activeTab}>
            <CardContent>
              <CustomTabList onChange={handleTabChange} variant='scrollable' pill='true'>
                <Tab label={t('settings.rootPage.tabs.general')} icon={<i className='tabler-settings' />} iconPosition='start' value='general' />
                <Tab label={t('settings.rootPage.tabs.web')} icon={<i className='tabler-world' />} iconPosition='start' value='web' />
                <Tab label={t('settings.rootPage.tabs.store')} icon={<i className='tabler-building-store' />} iconPosition='start' value='store' />
                <Tab label={t('settings.rootPage.tabs.finance')} icon={<i className='tabler-currency-dollar' />} iconPosition='start' value='finance' />
                <Tab label={t('settings.rootPage.tabs.delivery')} icon={<i className='tabler-truck' />} iconPosition='start' value='delivery' />
                <Tab label={t('settings.rootPage.tabs.marketing')} icon={<i className='tabler-speakerphone' />} iconPosition='start' value='marketing' />
              </CustomTabList>
            </CardContent>

            {/* General Tab */}
            <TabPanel value='general' className='p-0'>
              <CardContent>
                <Typography variant='h6'>{t('settings.rootPage.placeholders.generalTitle')}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('settings.rootPage.placeholders.generalBody')}
                </Typography>
              </CardContent>
            </TabPanel>

            {/* Web Tab */}
            <TabPanel value='web' className='p-0'>
              <CardContent>
                <Typography variant='h6'>{t('settings.rootPage.placeholders.webTitle')}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('settings.rootPage.placeholders.webBody')}
                </Typography>
              </CardContent>
            </TabPanel>

            {/* Store Tab */}
            <TabPanel value='store' className='p-0'>
              <CardContent>
                <Typography variant='h6'>{t('settings.rootPage.placeholders.storeTitle')}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('settings.rootPage.placeholders.storeBody')}
                </Typography>
              </CardContent>
            </TabPanel>

            {/* Finance Tab */}
            <TabPanel value='finance' className='p-0'>
              <CardContent>
                <Typography variant='h6'>{t('settings.rootPage.placeholders.financeTitle')}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('settings.rootPage.placeholders.financeBody')}
                </Typography>
              </CardContent>
            </TabPanel>

            {/* Delivery Tab */}
            <TabPanel value='delivery' className='p-0'>
              <CardContent>
                <Typography variant='h6'>{t('settings.rootPage.placeholders.deliveryTitle')}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('settings.rootPage.placeholders.deliveryBody')}
                </Typography>
              </CardContent>
            </TabPanel>

            {/* Marketing Tab */}
            <TabPanel value='marketing' className='p-0'>
              <CardContent>
                <Typography variant='h6'>{t('settings.rootPage.placeholders.marketingTitle')}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('settings.rootPage.placeholders.marketingBody')}
                </Typography>
              </CardContent>
            </TabPanel>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default SettingsPage

