import { BlockDefinition } from '../../../types'
import InsuranceStatsV1 from './index'

export const definition: BlockDefinition = {
  type: 'insurance_stats_v1',
  name: 'Insurance Stats V1',
  category: 'content',
  description: 'Statistics bar showing key metrics like customers served',
  settingsSchema: {
    theme: {
      type: 'select',
      label: 'Theme',
      default: 'brand',
      options: [
        { label: 'Brand', value: 'brand' },
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
      ],
    },
  },
  dataSchema: {
    stats: { type: 'array', label: 'Statistics' },
  },
  defaultSettings: {
    theme: 'brand',
  },
  defaultData: {
    stats: [
      { value: '500K+', label: 'Happy Customers' },
      { value: '$1.2B', label: 'Claims Paid' },
      { value: '4.8/5', label: 'Customer Rating' },
      { value: '24/7', label: 'Support Available' },
    ],
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
