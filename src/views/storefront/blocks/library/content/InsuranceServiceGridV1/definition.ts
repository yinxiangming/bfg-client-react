import { BlockDefinition } from '../../../../types'
import InsuranceServiceGridV1 from './index'

export const definition: BlockDefinition = {
  type: 'insurance_service_grid_v1',
  name: 'Insurance Service Grid V1 (Editorial)',
  category: 'content',
  description: 'High-end structural grid of insurance products',
  settingsSchema: {
    type: 'object',
    properties: {
      columns: { type: 'number', title: 'Columns', default: 3 },
      theme: { type: 'string', enum: ['light', 'dark', 'forest'], title: 'Theme' },
    },
  },
  dataSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', title: 'Section Title' },
      subtitle: { type: 'string', title: 'Section Subtitle' },
      services: {
        type: 'array',
        title: 'Services',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', title: 'Title' },
            description: { type: 'string', title: 'Description' },
            icon: { type: 'string', title: 'Icon URL' },
            link: { type: 'string', title: 'Link URL' },
          },
        },
      },
    },
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
