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
import CurrenciesTab from './CurrenciesTab'
import PaymentGatewaysTab from './PaymentGatewaysTab'
import TaxRatesTab from './TaxRatesTab'
import BrandsTab from './BrandsTab'
import FinancialCodesTab from './FinancialCodesTab'
import InvoiceSettingsTab from './InvoiceSettingsTab'

const tabPanelSx = {
  p: 0,
  height: '100%',
  backgroundColor: 'background.paper',
  '& .MuiBox-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  '& .MuiCard-root': { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxShadow: 'none' }
}

const FinanceSettingsPage = () => {
  const t = useTranslations('admin')
  const [activeTab, setActiveTab] = useState('currencies')
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
            {t('settings.finance.page.title')}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('settings.finance.page.subtitle')}
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
                    <Tab label={t('settings.finance.page.tabs.currencies')} icon={<i className='tabler-currency-dollar' />} iconPosition='start' value='currencies' />
                    <Tab label={t('settings.finance.page.tabs.paymentGateways')} icon={<i className='tabler-credit-card' />} iconPosition='start' value='gateways' />
                    <Tab label={t('settings.finance.page.tabs.taxRates')} icon={<i className='tabler-receipt-tax' />} iconPosition='start' value='tax' />
                    <Tab label={t('settings.finance.page.tabs.brands')} icon={<i className='tabler-building-store' />} iconPosition='start' value='brands' />
                    <Tab label={t('settings.finance.page.tabs.financialCodes')} icon={<i className='tabler-file-dollar' />} iconPosition='start' value='codes' />
                    <Tab label={t('settings.finance.page.tabs.invoiceSettings')} icon={<i className='tabler-file-invoice' />} iconPosition='start' value='invoice' />
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
                <TabPanel value='currencies' sx={tabPanelSx}>
                  <CurrenciesTab />
                </TabPanel>
                <TabPanel value='gateways' sx={tabPanelSx}>
                  <PaymentGatewaysTab />
                </TabPanel>
                <TabPanel value='tax' sx={tabPanelSx}>
                  <TaxRatesTab />
                </TabPanel>
                <TabPanel value='brands' sx={tabPanelSx}>
                  <BrandsTab />
                </TabPanel>
                <TabPanel value='codes' sx={tabPanelSx}>
                  <FinancialCodesTab />
                </TabPanel>
                <TabPanel value='invoice' sx={tabPanelSx}>
                  <InvoiceSettingsTab />
                </TabPanel>
              </Grid>
            </Grid>
          </TabContext>
        </Card>
      </Grid>
    </Grid>
  )
}

export default FinanceSettingsPage

