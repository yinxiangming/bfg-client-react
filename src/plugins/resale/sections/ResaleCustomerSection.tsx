'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

// Services
import type { Customer } from '@/services/store'
import { getCustomers } from '@/services/store'

// Type Imports
import type { Product } from '@/services/store'

type ResaleCustomerSectionProps = {
  productData?: Partial<Product> & {
    resale_customer_id?: number
    resale_commission_rate?: number
    is_resale_product?: boolean
  }
  onChange?: (field: string, value: any) => void
}

const ResaleCustomerSection = ({ productData, onChange }: ResaleCustomerSectionProps) => {
  const t = useTranslations('resale')
  const [isResale, setIsResale] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [commissionRate, setCommissionRate] = useState(80)
  const [loading, setLoading] = useState(false)

  // Sync from productData when it loads or changes (e.g. from product-owner API)
  useEffect(() => {
    const enable = !!productData?.is_resale_product
    setIsResale(enable)
    const rate = productData?.resale_commission_rate ?? 80
    setCommissionRate(rate)
    if (!enable) setSelectedCustomer(null)
  }, [productData?.is_resale_product, productData?.resale_commission_rate])

  // Load customers only when user opens the dropdown (onOpen), not on mount

  useEffect(() => {
    if (productData?.resale_customer_id != null && customers.length > 0) {
      const customer = customers.find(c => c.id === productData.resale_customer_id)
      setSelectedCustomer(customer ?? null)
    } else if (!productData?.resale_customer_id) {
      setSelectedCustomer(null)
    }
  }, [productData?.resale_customer_id, customers])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResaleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    setIsResale(checked)
    onChange?.('is_resale_product', checked)
    if (!checked) {
      setSelectedCustomer(null)
      onChange?.('resale_customer_id', null)
    }
  }

  const handleCustomerChange = (_event: any, customer: Customer | null) => {
    setSelectedCustomer(customer)
    onChange?.('resale_customer_id', customer?.id || null)
  }

  const handleCommissionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value) || 0
    setCommissionRate(value)
    onChange?.('resale_commission_rate', value)
  }

  // Helper function to get customer display name
  const getCustomerDisplayName = (customer: Customer) => {
    const firstName = customer.user?.first_name || ''
    const lastName = customer.user?.last_name || ''
    const email = customer.user?.email || customer.user_email || ''
    return { firstName, lastName, email, fullName: `${firstName} ${lastName}`.trim() || email }
  }

  return (
    <Card>
      <CardHeader
        title={t('section.resaleCardTitle')}
        subheader={t('section.resaleCardSubtitle')}
        action={
          <FormControlLabel
            control={<Switch checked={isResale} onChange={handleResaleToggle} />}
            label=""
          />
        }
      />
      {isResale && (
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Autocomplete
              value={selectedCustomer}
              onChange={handleCustomerChange}
              onOpen={() => loadCustomers()}
              options={customers}
              getOptionLabel={(option) => {
                const { fullName, email } = getCustomerDisplayName(option)
                return `${fullName} (${email})`
              }}
              loading={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('section.itemOwner')}
                  placeholder={t('section.customerPlaceholder')}
                  helperText={t('section.itemOwnerHelper')}
                />
              )}
              renderOption={(props, option) => {
                const { fullName, email } = getCustomerDisplayName(option)
                return (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body1">
                        {fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {email}
                      </Typography>
                    </Box>
                  </li>
                )
              }}
            />

            <TextField
              fullWidth
              label={t('section.commissionRate')}
              type="number"
              value={commissionRate}
              onChange={handleCommissionChange}
              helperText={t('section.commissionRateHelper')}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
            />

            {selectedCustomer && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('section.owner')}:
                </Typography>
                <Chip
                  label={getCustomerDisplayName(selectedCustomer).fullName}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        </CardContent>
      )}
    </Card>
  )
}

export default ResaleCustomerSection
