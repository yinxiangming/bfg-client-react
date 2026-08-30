'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import SettingsTabsPage from '@/components/admin/settings/SettingsTabsPage'
import WarehousesTab from './WarehousesTab'
import PickupPointsTab from './PickupPointsTab'
import FreightServicesTab from './FreightServicesTab'
import CarriersTab from './CarriersTab'
import FreightStatusesTab from './FreightStatusesTab'
import TrackingEventsTab from './TrackingEventsTab'
import PackagingTypesTab from './PackagingTypesTab'
import DeliveryZonesTab from './DeliveryZonesTab'
import DeliverySettingsTab from './DeliverySettingsTab'

const DeliverySettingsPage = () => {
  const t = useTranslations('admin')

  return (
    <SettingsTabsPage
      title={t('settings.delivery.page.title')}
      subtitle={t('settings.delivery.page.subtitle')}
      defaultTab='warehouses'
      tabs={[
        {
          value: 'warehouses',
          label: t('settings.delivery.page.tabs.warehouses'),
          icon: 'tabler-building-warehouse',
          content: <WarehousesTab />
        },
        {
          value: 'pickup-points',
          label: t('settings.delivery.page.tabs.pickupPoints'),
          icon: 'tabler-map-pin-check',
          content: <PickupPointsTab />
        },
        {
          value: 'freight-services',
          label: t('settings.delivery.page.tabs.freightServices'),
          icon: 'tabler-route',
          content: <FreightServicesTab />
        },
        {
          value: 'carriers',
          label: t('settings.delivery.page.tabs.carriers'),
          icon: 'tabler-truck',
          content: <CarriersTab />
        },
        {
          value: 'freight-status',
          label: t('settings.delivery.page.tabs.freightStatus'),
          icon: 'tabler-flag',
          content: <FreightStatusesTab />
        },
        {
          value: 'tracking-events',
          label: t('settings.delivery.page.tabs.trackingEvents'),
          icon: 'tabler-timeline-event',
          content: <TrackingEventsTab />
        },
        {
          value: 'packaging',
          label: t('settings.delivery.page.tabs.packagingTypes'),
          icon: 'tabler-package',
          content: <PackagingTypesTab />
        },
        {
          value: 'zones',
          label: t('settings.delivery.page.tabs.deliveryZones'),
          icon: 'tabler-map-pin',
          content: <DeliveryZonesTab />
        },
        {
          value: 'delivery',
          label: t('settings.delivery.page.tabs.deliverySettings'),
          icon: 'tabler-settings',
          content: <DeliverySettingsTab />
        }
      ]}
    />
  )
}

export default DeliverySettingsPage
