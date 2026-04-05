import { BlockDefinition } from '../../../../types'
import InsuranceStatsV1 from './index'

export const definition: BlockDefinition = {
  type: 'insurance_stats_v1',
  name: 'Insurance Stats V1',
  category: 'content',
  description: 'Statistics bar showing key metrics like customers served',
  settingsSchema: {
    type: 'object',
    properties: {
      theme: { type: 'string', enum: ['brand', 'dark', 'light'], title: 'Theme' },
    },
  },
  dataSchema: {
    type: 'object',
    properties: {
      stats: {
        type: 'array',
        title: 'Statistics',
        items: {
          type: 'object',
          properties: {
            value: { type: 'string', title: 'Value (e.g. "500K+")' },
            label: { type: 'string', title: 'Label' },
          },
        },
      },
    },
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
