'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

// Component Imports
import PaymentMethods from './payments/PaymentMethods'
import PaymentHistory from './payments/PaymentHistory'
import Invoices from './payments/Invoices'

const Payments = () => {
  const t = useTranslations('account.payments')
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <Tabs
          value={activeTab}
          onChange={(e, value) => setActiveTab(value)}
          variant='scrollable'
          scrollButtons='auto'
          sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
        >
          <Tab
            label={t('paymentMethods')}
            icon={<i className='tabler-credit-card' />}
            iconPosition='start'
          />
          <Tab
            label={t('paymentHistory')}
            icon={<i className='tabler-history' />}
            iconPosition='start'
          />
          <Tab
            label={t('invoices')}
            icon={<i className='tabler-file-invoice' />}
            iconPosition='start'
          />
        </Tabs>
      </Grid>

      <Grid size={{ xs: 12 }}>
        {activeTab === 0 && (
          <Box>
            <PaymentMethods />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <PaymentHistory />
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Invoices />
          </Box>
        )}
      </Grid>
    </Grid>
  )
}

export default Payments

