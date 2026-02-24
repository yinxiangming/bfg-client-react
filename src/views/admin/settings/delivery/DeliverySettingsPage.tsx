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

// Tab Components
import WarehousesTab from './WarehousesTab'
import FreightServicesTab from './FreightServicesTab'
import CarriersTab from './CarriersTab'
import FreightStatusesTab from './FreightStatusesTab'
import TrackingEventsTab from './TrackingEventsTab'
import PackagingTypesTab from './PackagingTypesTab'
import DeliveryZonesTab from './DeliveryZonesTab'
import DeliverySettingsTab from './DeliverySettingsTab'

const DeliverySettingsPage = () => {
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState('warehouses')
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
            {t('settings.delivery.page.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.delivery.page.subtitle')}
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
              {/* Left sidebar with vertical tabs */}
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
                    <Tab
                      label={t('settings.delivery.page.tabs.warehouses')}
                      icon={<i className='tabler-building-warehouse' />}
                      iconPosition='start'
                      value='warehouses'
                    />
                    <Tab
                      label={t('settings.delivery.page.tabs.freightServices')}
                      icon={<i className='tabler-route' />}
                      iconPosition='start'
                      value='freight-services'
                    />
                    <Tab
                      label={t('settings.delivery.page.tabs.carriers')}
                      icon={<i className='tabler-truck' />}
                      iconPosition='start'
                      value='carriers'
                    />
                    <Tab
                      label={t('settings.delivery.page.tabs.freightStatus')}
                      icon={<i className='tabler-flag' />}
                      iconPosition='start'
                      value='freight-status'
                    />
                    <Tab
                      label={t('settings.delivery.page.tabs.trackingEvents')}
                      icon={<i className='tabler-timeline-event' />}
                      iconPosition='start'
                      value='tracking-events'
                    />
                    <Tab
                      label={t('settings.delivery.page.tabs.packagingTypes')}
                      icon={<i className='tabler-package' />}
                      iconPosition='start'
                      value='packaging'
                    />
                    <Tab
                      label={t('settings.delivery.page.tabs.deliveryZones')}
                      icon={<i className='tabler-map-pin' />}
                      iconPosition='start'
                      value='zones'
                    />
                    <Tab
                      label={t('settings.delivery.page.tabs.deliverySettings')}
                      icon={<i className='tabler-settings' />}
                      iconPosition='start'
                      value='delivery'
                    />
                  </CustomTabList>
                </CardContent>
              </Grid>

              {/* Right content area */}
              <Grid 
                size={{ xs: 12, md: false }}
                sx={{ 
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'background.paper'
                }}
              >
                <TabPanel 
                  value='warehouses' 
                  sx={{ 
                    p: 0, 
                    height: '100%',
                    backgroundColor: 'background.paper',
                    '& .MuiBox-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    },
                    '& .MuiCard-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      boxShadow: 'none'
                    }
                  }}
                >
                  <WarehousesTab />
                </TabPanel>

                <TabPanel 
                  value='freight-services' 
                  sx={{ 
                    p: 0, 
                    height: '100%',
                    backgroundColor: 'background.paper',
                    '& .MuiBox-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    },
                    '& .MuiCard-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      boxShadow: 'none'
                    }
                  }}
                >
                  <FreightServicesTab />
                </TabPanel>

                <TabPanel 
                  value='carriers' 
                  sx={{ 
                    p: 0, 
                    height: '100%',
                    backgroundColor: 'background.paper',
                    '& .MuiBox-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    },
                    '& .MuiCard-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      boxShadow: 'none'
                    }
                  }}
                >
                  <CarriersTab />
                </TabPanel>

                <TabPanel 
                  value='freight-status' 
                  sx={{ 
                    p: 0, 
                    height: '100%',
                    backgroundColor: 'background.paper',
                    '& .MuiBox-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    },
                    '& .MuiCard-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      boxShadow: 'none'
                    }
                  }}
                >
                  <FreightStatusesTab />
                </TabPanel>

                <TabPanel 
                  value='tracking-events' 
                  sx={{ 
                    p: 0, 
                    height: '100%',
                    backgroundColor: 'background.paper',
                    '& .MuiBox-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    },
                    '& .MuiCard-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      boxShadow: 'none'
                    }
                  }}
                >
                  <TrackingEventsTab />
                </TabPanel>

                <TabPanel 
                  value='packaging' 
                  sx={{ 
                    p: 0, 
                    height: '100%',
                    backgroundColor: 'background.paper',
                    '& .MuiBox-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    },
                    '& .MuiCard-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      boxShadow: 'none'
                    }
                  }}
                >
                  <PackagingTypesTab />
                </TabPanel>

                <TabPanel 
                  value='zones' 
                  sx={{ 
                    p: 0, 
                    height: '100%',
                    backgroundColor: 'background.paper',
                    '& .MuiBox-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    },
                    '& .MuiCard-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      boxShadow: 'none'
                    }
                  }}
                >
                  <DeliveryZonesTab />
                </TabPanel>

                <TabPanel 
                  value='delivery' 
                  sx={{ 
                    p: 0, 
                    height: '100%',
                    backgroundColor: 'background.paper',
                    '& .MuiBox-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0
                    },
                    '& .MuiCard-root': {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      boxShadow: 'none'
                    }
                  }}
                >
                  <DeliverySettingsTab />
                </TabPanel>
              </Grid>
            </Grid>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default DeliverySettingsPage
