'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { storefrontApi } from '@/utils/storefrontApi'
import type { CheckoutFormData, FreightService } from './types'

type Props = {
  formData: CheckoutFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  country: string
  onFreightServiceChange?: (serviceId: number | null) => void
}

const CheckoutShippingSection = ({ formData, onChange, country, onFreightServiceChange }: Props) => {
  const t = useTranslations('storefront')
  const [freightServices, setFreightServices] = useState<FreightService[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [calculatedPrices, setCalculatedPrices] = useState<Record<number, number>>({})

  // Fetch freight services for country
  useEffect(() => {
    const fetchServices = async () => {
      if (!country) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const services = await storefrontApi.getFreightServicesForCountry(country)
        setFreightServices(services || [])
        
        // Auto-select first service if none selected
        if (services && services.length > 0 && !formData.freightServiceId) {
          const firstService = services[0]
          handleServiceSelect(firstService.id)
        }
      } catch (error) {
        console.error('Failed to fetch freight services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [country])

  // Calculate shipping cost for each service
  useEffect(() => {
    const calculatePrices = async () => {
      if (freightServices.length === 0) return

      const prices: Record<number, number> = {}
      
      // Calculate price for each service
      for (const service of freightServices) {
        try {
          const preview = await storefrontApi.getCartPreview(undefined, service.id)
          prices[service.id] = parseFloat(preview.shipping_cost)
        } catch (error) {
          console.error(`Failed to calculate price for service ${service.id}:`, error)
          // Fallback to base_price if calculation fails
          prices[service.id] = parseFloat(service.base_price)
        }
      }

      setCalculatedPrices(prices)
    }

    calculatePrices()
  }, [freightServices])

  const handleServiceSelect = (serviceId: number) => {
    // Update form data via onChange
    const event = {
      target: {
        name: 'freightServiceId',
        value: serviceId.toString()
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    // Use a custom handler that updates both freightServiceId and shippingMethod
    const customOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange(e)
      
      // Also update shippingMethod for backward compatibility
      const service = freightServices.find(s => s.id === serviceId)
      if (service) {
        const methodEvent = {
          target: {
            name: 'shippingMethod',
            value: service.code || 'standard'
          }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(methodEvent)
      }
    }
    
    customOnChange(event)

    // Notify parent
    if (onFreightServiceChange) {
      onFreightServiceChange(serviceId)
    }
  }

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`
  }

  const formatDeliveryDays = (min: number, max: number): string => {
    if (min === max) {
      return `${min} ${min !== 1 ? t('checkout.shipping.businessDays') : t('checkout.shipping.businessDay')}`
    }
    return `${min}-${max} ${t('checkout.shipping.businessDays')}`
  }

  const visibleServices = expanded ? freightServices : freightServices.slice(0, 3)
  const hasMoreServices = freightServices.length > 3

  if (loading) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#2c3e50' }}>{t('checkout.shipping.title')}</h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#757575' }}>{t('checkout.shipping.loadingOptions')}</div>
      </div>
    )
  }

  if (freightServices.length === 0) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#2c3e50' }}>{t('checkout.shipping.title')}</h2>
        <div style={{ padding: '1rem', border: '1px solid #d0d0d0', borderRadius: '8px', color: '#757575' }}>
          {t('checkout.shipping.noOptions')}
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#2c3e50' }}>{t('checkout.shipping.title')}</h2>
      
      <div style={{ border: '1px solid #d0d0d0', borderRadius: '8px', overflow: 'hidden' }}>
        {visibleServices.map((service, index) => {
          const isSelected = formData.freightServiceId === service.id
          const price = calculatedPrices[service.id] ?? parseFloat(service.base_price)
          const isLast = index === visibleServices.length - 1 && !expanded && !hasMoreServices

          return (
            <label
              key={service.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#f9fafb' : 'white',
                borderBottom: isLast ? 'none' : '1px solid #d0d0d0',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'white'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <input
                  type='radio'
                  name='freightServiceId'
                  value={service.id.toString()}
                  checked={isSelected}
                  onChange={() => handleServiceSelect(service.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#2c3e50' }}>
                    {service.name}
                    {service.carrier_name && (
                      <span style={{ fontSize: '0.75rem', color: '#757575', marginLeft: '0.5rem' }}>
                        ({service.carrier_name})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#757575' }}>
                    {formatDeliveryDays(service.estimated_days_min, service.estimated_days_max)}
                    {service.description && ` • ${service.description}`}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50', marginLeft: '1rem' }}>
                {formatPrice(price)}
              </div>
            </label>
          )
        })}

        {hasMoreServices && !expanded && (
          <button
            type='button'
            onClick={() => setExpanded(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: 'none',
              borderTop: '1px solid #d0d0d0',
              backgroundColor: 'white',
              color: '#6366f1',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
            }}
          >
            {t('checkout.shipping.showMore', { count: freightServices.length - 3 })}
          </button>
        )}

        {expanded && hasMoreServices && (
          <button
            type='button'
            onClick={() => setExpanded(false)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: 'none',
              borderTop: '1px solid #d0d0d0',
              backgroundColor: 'white',
              color: '#6366f1',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
            }}
          >
            {t('checkout.shipping.showFewer')}
          </button>
        )}
      </div>
    </div>
  )
}

export default CheckoutShippingSection
