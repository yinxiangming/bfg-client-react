'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import AddressAutocomplete from '@/components/storefront/AddressAutocomplete'
import type { CheckoutFormData, Address, UserInfo } from './types'

type Props = {
  formData: CheckoutFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onAddressChange: (value: string) => void
  onAddressSelect: (components: { address: string; city: string; state: string; zip: string; country: string }) => void
  isAuthenticated: boolean
  user: UserInfo | null
  addresses: Address[]
  selectedAddressId: number | null
  onSelectAddress: (id: number | null) => void
}

const CheckoutDeliverySection = ({
  formData,
  onChange,
  onAddressChange,
  onAddressSelect,
  isAuthenticated,
  user,
  addresses,
  selectedAddressId,
  onSelectAddress
}: Props) => {
  const t = useTranslations('storefront')
  const [addressesExpanded, setAddressesExpanded] = useState(false)
  const ADDRESS_VISIBLE_COUNT = 3
  const visibleAddresses = addressesExpanded ? addresses : addresses.slice(0, ADDRESS_VISIBLE_COUNT)
  const hasMoreAddresses = addresses.length > ADDRESS_VISIBLE_COUNT
  const moreCount = addresses.length - ADDRESS_VISIBLE_COUNT

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#2c3e50' }}>{t('checkout.delivery.title')}</h2>
        {isAuthenticated && user && (
          <div style={{ fontSize: '0.875rem', color: '#757575' }}>
            {t('checkout.delivery.loggedInAs', { email: user.email })}
          </div>
        )}
      </div>
      
      {/* Saved Addresses for Authenticated Users */}
      {isAuthenticated && addresses && addresses.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#2c3e50' }}>
            {t('checkout.delivery.selectSavedAddress')}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visibleAddresses.map((addr) => (
              <label
                key={addr.id}
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: selectedAddressId === addr.id ? '2px solid #6366f1' : '1px solid #d0d0d0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedAddressId === addr.id ? '#f0f1ff' : 'white',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type='radio'
                  name='savedAddress'
                  checked={selectedAddressId === addr.id}
                  onChange={() => onSelectAddress(addr.id)}
                  style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#2c3e50', marginBottom: '0.25rem' }}>
                    {addr.full_name || `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || t('common.na')}
                    {addr.is_default && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>
                        {t('checkout.delivery.defaultLabel')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#757575', lineHeight: 1.5 }}>
                    {addr.address_line1 || addr.address1 || ''}
                    {(addr.address_line2 || addr.address2) && `, ${addr.address_line2 || addr.address2}`}
                    <br />
                    {addr.city}{addr.state && `, ${addr.state}`} {addr.postal_code}
                    <br />
                    {addr.country}
                  </div>
                </div>
              </label>
            ))}
          </div>
          {hasMoreAddresses && !addressesExpanded && (
            <button
              type='button'
              onClick={() => setAddressesExpanded(true)}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0',
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left'
              }}
            >
              {t('checkout.delivery.showAllAddresses')} ({t('checkout.delivery.moreAddressesAvailable', { count: moreCount })})
            </button>
          )}
          {hasMoreAddresses && addressesExpanded && (
            <button
              type='button'
              onClick={() => setAddressesExpanded(false)}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0',
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left'
              }}
            >
              {t('checkout.delivery.showFewerAddresses')}
            </button>
          )}
          <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
            <button
              type='button'
              onClick={() => onSelectAddress(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              {t('checkout.delivery.useDifferentAddress')}
            </button>
          </div>
        </div>
      )}
      
      {/* Show form fields only if no address selected or user is not authenticated */}
      {(!isAuthenticated || !selectedAddressId) && (
        <>
          {/* Country */}
          <div style={{ marginBottom: '1rem' }}>
            <select
              name='country'
              value={formData.country}
              onChange={onChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value='US'>{t('checkout.delivery.country.us')}</option>
              <option value='CA'>{t('checkout.delivery.country.ca')}</option>
              <option value='GB'>{t('checkout.delivery.country.gb')}</option>
            </select>
          </div>

          {/* Name Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type='text'
              name='firstName'
              placeholder={t('checkout.delivery.firstNameOptional')}
              value={formData.firstName}
              onChange={onChange}
              style={{
                padding: '0.875rem 1rem',
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
            <input
              type='text'
              name='lastName'
              placeholder={t('checkout.delivery.lastName')}
              value={formData.lastName}
              onChange={onChange}
              required
              style={{
                padding: '0.875rem 1rem',
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Address with Autocomplete */}
          <div style={{ marginBottom: '1rem' }}>
            <AddressAutocomplete
              value={formData.address}
              onChange={onAddressChange}
              onAddressSelect={onAddressSelect}
              placeholder={t('checkout.delivery.address')}
              required
            />
          </div>

          {/* Apartment */}
          <div style={{ marginBottom: '1rem' }}>
            <input
              type='text'
              name='apartment'
              placeholder={t('checkout.delivery.apartmentOptional')}
              value={formData.apartment}
              onChange={onChange}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* City, State, ZIP */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type='text'
              name='city'
              placeholder={t('checkout.delivery.city')}
              value={formData.city}
              onChange={onChange}
              required
              style={{
                padding: '0.875rem 1rem',
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
            <input
              type='text'
              name='state'
              placeholder={t('checkout.delivery.state')}
              value={formData.state}
              onChange={onChange}
              required
              style={{
                padding: '0.875rem 1rem',
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
            <input
              type='text'
              name='zip'
              placeholder={t('checkout.delivery.zipCode')}
              value={formData.zip}
              onChange={onChange}
              required
              style={{
                padding: '0.875rem 1rem',
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '1rem' }}>
            <input
              type='tel'
              name='phone'
              placeholder={t('checkout.delivery.phone')}
              value={formData.phone}
              onChange={onChange}
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Save Info Checkbox */}
          {!isAuthenticated && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#2c3e50' }}>
              <input type='checkbox' style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              {t('checkout.delivery.saveInfoNextTime')}
            </label>
          )}
        </>
      )}
    </div>
  )
}

export default CheckoutDeliverySection
