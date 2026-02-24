'use client'

// React Imports
import { useState } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

// Icon Imports
import Icon from '@components/Icon'

// Component Imports
import AddressSelectModal from '@/components/admin/AddressSelectModal'

// API Imports
import { updateOrder, type Address } from '@/services/store'

type AddressCardsProps = {
  orderId: number
  customerId?: number
  shippingAddress?: Address
  billingAddress?: Address
  onUpdate?: () => void
}

const AddressCards = ({ orderId, customerId, shippingAddress, billingAddress, onUpdate }: AddressCardsProps) => {
  const t = useTranslations('admin')
  const [shippingModalOpen, setShippingModalOpen] = useState(false)
  const [billingModalOpen, setBillingModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const formatAddress = (address?: Address) => {
    if (!address) return null

    const parts = [
      address.full_name && `${t('orders.addressCards.labels.attn')}: ${address.full_name}`,
      address.company,
      address.address_line1,
      address.address_line2,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean)

    return parts
  }

  const handleAddressSelect = async (type: 'shipping' | 'billing', address: Address) => {
    if (!address.id) return

    setUpdating(true)
    try {
      const updateData: any = {}
      if (type === 'shipping') {
        updateData.shipping_address_id = address.id
      } else {
        updateData.billing_address_id = address.id
      }

      await updateOrder(orderId, updateData)
      
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to update address', error)
      alert(t('orders.addressCards.errors.updateFailed'))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='h6'>{t('orders.addressCards.shipping.title')}</Typography>
              <Tooltip title={t('orders.addressCards.shipping.actions.editTooltip')}>
                <IconButton
                  size='small'
                  onClick={() => setShippingModalOpen(true)}
                  disabled={updating || !customerId}
                >
                  <Icon icon='mdi:pencil' />
                </IconButton>
              </Tooltip>
            </Box>
            {shippingAddress ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {formatAddress(shippingAddress)?.map((line, index) => (
                  <Typography key={index} variant='body2'>{line}</Typography>
                ))}
                {(shippingAddress.phone || shippingAddress.email) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                    {shippingAddress.phone && (
                      <Typography variant='body2' color='text.secondary'>
                        {t('orders.addressCards.labels.phone')}: {shippingAddress.phone}
                      </Typography>
                    )}
                    {shippingAddress.email && (
                      <Typography variant='body2' color='text.secondary'>
                        {t('orders.addressCards.labels.email')}: {shippingAddress.email}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Typography color='text.secondary' variant='body2'>{t('orders.addressCards.shipping.empty')}</Typography>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='h6'>{t('orders.addressCards.billing.title')}</Typography>
              <Tooltip title={t('orders.addressCards.billing.actions.editTooltip')}>
                <IconButton
                  size='small'
                  onClick={() => setBillingModalOpen(true)}
                  disabled={updating || !customerId}
                >
                  <Icon icon='mdi:pencil' />
                </IconButton>
              </Tooltip>
            </Box>
            {billingAddress ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {formatAddress(billingAddress)?.map((line, index) => (
                  <Typography key={index} variant='body2'>{line}</Typography>
                ))}
                {(billingAddress.phone || billingAddress.email) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                    {billingAddress.phone && (
                      <Typography variant='body2' color='text.secondary'>
                        {t('orders.addressCards.labels.phone')}: {billingAddress.phone}
                      </Typography>
                    )}
                    {billingAddress.email && (
                      <Typography variant='body2' color='text.secondary'>
                        {t('orders.addressCards.labels.email')}: {billingAddress.email}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            ) : (
              <Typography color='text.secondary' variant='body2'>{t('orders.addressCards.billing.empty')}</Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {customerId && (
        <>
          <AddressSelectModal
            open={shippingModalOpen}
            onClose={() => setShippingModalOpen(false)}
            onSelect={(address) => handleAddressSelect('shipping', address)}
            customerId={customerId}
            currentAddressId={shippingAddress?.id}
            allowCreate={true}
          />
          <AddressSelectModal
            open={billingModalOpen}
            onClose={() => setBillingModalOpen(false)}
            onSelect={(address) => handleAddressSelect('billing', address)}
            customerId={customerId}
            currentAddressId={billingAddress?.id}
            allowCreate={true}
          />
        </>
      )}
    </>
  )
}

export default AddressCards
