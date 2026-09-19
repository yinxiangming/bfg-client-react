'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import SettingsTabsPage from '@/components/admin/settings/SettingsTabsPage'
import CurrenciesTab from './CurrenciesTab'
import PaymentGatewaysTab from './PaymentGatewaysTab'
import TaxRatesTab from './TaxRatesTab'
import BrandsTab from './BrandsTab'
import FinancialCodesTab from './FinancialCodesTab'
import InvoiceSettingsTab from './InvoiceSettingsTab'

const FinanceSettingsPage = () => {
  const t = useTranslations('admin')

  return (
    <SettingsTabsPage
      title={t('settings.finance.page.title')}
      subtitle={t('settings.finance.page.subtitle')}
      defaultTab='currencies'
      tabs={[
        {
          value: 'currencies',
          label: t('settings.finance.page.tabs.currencies'),
          icon: 'tabler-currency-dollar',
          content: <CurrenciesTab />
        },
        {
          value: 'gateways',
          label: t('settings.finance.page.tabs.paymentGateways'),
          icon: 'tabler-credit-card',
          content: <PaymentGatewaysTab />
        },
        {
          value: 'tax',
          label: t('settings.finance.page.tabs.taxRates'),
          icon: 'tabler-receipt-tax',
          content: <TaxRatesTab />
        },
        {
          value: 'brands',
          label: t('settings.finance.page.tabs.brands'),
          icon: 'tabler-building-store',
          content: <BrandsTab />
        },
        {
          value: 'codes',
          label: t('settings.finance.page.tabs.financialCodes'),
          icon: 'tabler-file-dollar',
          content: <FinancialCodesTab />
        },
        {
          value: 'invoice',
          label: t('settings.finance.page.tabs.invoiceSettings'),
          icon: 'tabler-file-invoice',
          content: <InvoiceSettingsTab />
        }
      ]}
    />
  )
}

export default FinanceSettingsPage
