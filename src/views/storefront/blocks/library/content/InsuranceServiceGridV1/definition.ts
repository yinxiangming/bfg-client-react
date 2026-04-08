import { BlockDefinition } from '../../../types'
import InsuranceServiceGridV1 from './index'

export const definition: BlockDefinition = {
  type: 'insurance_service_grid_v1',
  name: 'Insurance Service Grid V1 (Editorial)',
  category: 'content',
  description: 'High-end structural grid of insurance products',
  settingsSchema: {
    columns: {
      type: 'integer',
      label: 'Columns',
      default: 3,
    },
    theme: {
      type: 'select',
      label: 'Theme',
      default: 'light',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Forest', value: 'forest' },
      ],
    },
  },
  dataSchema: {
    title: { type: 'string', label: 'Section Title' },
    subtitle: { type: 'string', label: 'Section Subtitle' },
    services: { type: 'array', label: 'Services' },
  },
  defaultSettings: {
    columns: 3,
    theme: 'light',
  },
  defaultData: {
    title: 'Curated Portfolios',
    subtitle: 'Comprehensive coverage strategies designed to protect and preserve every facet of your life and legacy.',
    services: [
      {
        title: 'Private Estate',
        description: 'Bespoke protection for primary residences, secondary homes, and high-value architectural properties.',
        icon: 'https://cdn-icons-png.flaticon.com/512/602/602182.png',
        link: '/estate',
      },
      {
        title: 'Motor & Aviation',
        description: 'Specialized policies for luxury vehicle collections, yachts, and private aircraft.',
        icon: 'https://cdn-icons-png.flaticon.com/512/3202/3202003.png',
        link: '/motor',
      },
      {
        title: 'Fine Art & Valuables',
        description: 'Discrete, worldwide coverage for jewelry, fine art, wine collections, and antiquities.',
        icon: 'https://cdn-icons-png.flaticon.com/512/3004/3004458.png',
        link: '/valuables',
      },
    ],
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
