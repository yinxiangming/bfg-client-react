'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { storefrontApi, type StorefrontPickupPoint } from '@/utils/storefrontApi'
import { useStorefrontCurrency } from '@/hooks/useStorefrontCurrency'
import type { CheckoutFormData, FreightService } from './types'

type Props = {
  formData: CheckoutFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  country: string
  onFreightServiceChange?: (serviceId: number | null) => void
  /** Called whenever the shopper switches between collecting and being posted to. */
  onFulfillmentChange?: (method: 'shipping' | 'pickup', pickupPointId?: number) => void
}

const rowStyle = (isSelected: boolean, isLast: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem',
  cursor: 'pointer',
  backgroundColor: isSelected ? '#f9fafb' : 'white',
  borderBottom: isLast ? 'none' : '1px solid #d0d0d0',
  transition: 'background-color 0.2s'
})

const CheckoutShippingSection = ({ formData, onChange, country, onFreightServiceChange, onFulfillmentChange }: Props) => {
  const t = useTranslations('storefront')
  const { formatPrice } = useStorefrontCurrency()
  const [freightServices, setFreightServices] = useState<FreightService[]>([])
  const [pickupPoints, setPickupPoints] = useState<StorefrontPickupPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [calculatedPrices, setCalculatedPrices] = useState<Record<number, number>>({})

  const isPickup = formData.fulfillmentMethod === 'pickup'

  // Collection points do not depend on a delivery country — a shop with no
  // courier at all still has options to show, which is the wxstore case.
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const [points, services] = await Promise.all([
        storefrontApi.getPickupPoints().catch(() => [] as StorefrontPickupPoint[]),
        country
          ? storefrontApi.getFreightServicesForCountry(country).catch(() => [] as FreightService[])
          : Promise.resolve([] as FreightService[])
      ])
      if (cancelled) return

      setPickupPoints(points || [])
      setFreightServices(services || [])
      setLoading(false)

      // Auto-select, but never over an explicit choice the shopper already made.
      if (formData.freightServiceId || formData.pickupPointId) return
      if (services && services.length > 0) {
        selectService(services[0], services)
      } else if (points && points.length > 0) {
        selectPoint(points[0])
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [country])

  // Freight prices depend on the cart, so they have to be quoted per service.
  // A pickup point charges a flat fee it already told us.
  useEffect(() => {
    const calculatePrices = async () => {
      if (freightServices.length === 0) return

      const prices: Record<number, number> = {}
      for (const service of freightServices) {
        try {
          const preview = await storefrontApi.getCartPreview(undefined, service.id)
          prices[service.id] = parseFloat(preview.shipping_cost)
        } catch (error) {
          console.error(`Failed to calculate price for service ${service.id}:`, error)
          prices[service.id] = parseFloat(service.base_price)
        }
      }
      setCalculatedPrices(prices)
    }

    calculatePrices()
  }, [freightServices])

  const emit = (name: string, value: string) => {
    onChange({ target: { name, value } } as React.ChangeEvent<HTMLInputElement>)
  }

  const selectService = (service: FreightService, pool: FreightService[] = freightServices) => {
    emit('freightServiceId', service.id.toString())
    emit('shippingMethod', service.code || 'standard')
    emit('fulfillmentMethod', 'shipping')
    onFreightServiceChange?.(service.id)
    onFulfillmentChange?.('shipping')
    void pool
  }

  const selectPoint = (point: StorefrontPickupPoint) => {
    emit('fulfillmentMethod', 'pickup')
    emit('pickupPointId', point.id.toString())
    // Drop any courier the shopper had selected: nothing is being carried.
    onFreightServiceChange?.(null)
    onFulfillmentChange?.('pickup', point.id)
  }

  const formatDeliveryDays = (min: number, max: number): string => {
    if (min === max) {
      return `${min} ${min !== 1 ? t('checkout.shipping.businessDays') : t('checkout.shipping.businessDay')}`
    }
    return `${min}-${max} ${t('checkout.shipping.businessDays')}`
  }

  const visibleServices = expanded ? freightServices : freightServices.slice(0, 3)
  const hasMoreServices = freightServices.length > 3
  const totalOptions = pickupPoints.length + freightServices.length

  if (loading) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#2c3e50' }}>{t('checkout.shipping.title')}</h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#757575' }}>{t('checkout.shipping.loadingOptions')}</div>
      </div>
    )
  }

  if (totalOptions === 0) {
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
        {/* Collection first: it is free of a delivery address, and for a shop
            that mostly collects it is the answer most shoppers want. */}
        {pickupPoints.map((point, index) => {
          const isSelected = isPickup && formData.pickupPointId === point.id
          const fee = parseFloat(point.fee || '0')
          const isLast = index === pickupPoints.length - 1 && visibleServices.length === 0 && !hasMoreServices

          return (
            <label key={`pickup-${point.id}`} style={rowStyle(isSelected, isLast)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <input
                  type='radio'
                  name='fulfillmentOption'
                  checked={isSelected}
                  onChange={() => selectPoint(point)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#2c3e50' }}>
                    {t('checkout.shipping.pickupAt', { point: point.name })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#757575' }}>{point.address}</div>
                  {point.instructions && (
                    <div style={{ fontSize: '0.75rem', color: '#757575', whiteSpace: 'pre-line' }}>
                      {point.instructions}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50', marginLeft: '1rem' }}>
                {fee > 0 ? formatPrice(fee) : t('checkout.shipping.free')}
              </div>
            </label>
          )
        })}

        {visibleServices.map((service, index) => {
          const isSelected = !isPickup && formData.freightServiceId === service.id
          const price = calculatedPrices[service.id] ?? parseFloat(service.base_price)
          const isLast = index === visibleServices.length - 1 && !expanded && !hasMoreServices

          return (
            <label key={`ship-${service.id}`} style={rowStyle(isSelected, isLast)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <input
                  type='radio'
                  name='fulfillmentOption'
                  checked={isSelected}
                  onChange={() => selectService(service)}
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

        {hasMoreServices && (
          <button
            type='button'
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: 'none',
              borderTop: '1px solid #d0d0d0',
              backgroundColor: 'white',
              color: '#6366f1',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {expanded
              ? t('checkout.shipping.showFewer')
              : t('checkout.shipping.showMore', { count: freightServices.length - 3 })}
          </button>
        )}
      </div>
    </div>
  )
}

export default CheckoutShippingSection
