'use client'

import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { useTranslations } from 'next-intl'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import CustomTabList from '@/components/ui/TabList'
import SupportSettingsTab from './SupportSettingsTab'
import CategoriesTab from './CategoriesTab'
import PrioritiesTab from './PrioritiesTab'

const tabPanelSx = {
  p: 0,
  height: '100%',
  backgroundColor: 'background.paper',
  '& .MuiBox-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  '& .MuiCard-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxShadow: 'none' }
}

const SupportSettingsPage = () => {
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState('settings')
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  const handleTabChange = (_event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <div>
          <Typography variant='h4' sx={{ mb: 1 }}>
            {t('settings.support.page.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.support.page.subtitle')}
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
                    <Tab label={t('settings.support.page.tabs.settings')} icon={<i className='tabler-settings' />} iconPosition='start' value='settings' />
                    <Tab label={t('settings.support.page.tabs.categories')} icon={<i className='tabler-folders' />} iconPosition='start' value='categories' />
                    <Tab label={t('settings.support.page.tabs.priorities')} icon={<i className='tabler-flag' />} iconPosition='start' value='priorities' />
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
                <TabPanel value='settings' sx={tabPanelSx}>
                  <SupportSettingsTab />
                </TabPanel>
                <TabPanel value='categories' sx={tabPanelSx}>
                  <CategoriesTab />
                </TabPanel>
                <TabPanel value='priorities' sx={tabPanelSx}>
                  <PrioritiesTab />
                </TabPanel>
              </Grid>
            </Grid>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default SupportSettingsPage
