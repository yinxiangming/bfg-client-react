import { BlockDefinition } from '../../../types'
import InsuranceHeroV1 from './index'

export const definition: BlockDefinition = {
  type: 'insurance_hero_v1',
  name: 'Insurance Hero V1 (Editorial)',
  category: 'hero',
  description: 'High-end editorial hero section with majestic typography',
  settingsSchema: {
    height: {
      type: 'string',
      label: 'Min Height',
      default: '85vh',
    },
    align: {
      type: 'select',
      label: 'Alignment',
      default: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
      ],
    },
    theme: {
      type: 'select',
      label: 'Theme',
      default: 'forest',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Forest', value: 'forest' },
      ],
    },
  },
  dataSchema: {
    title: { type: 'string', label: 'Title (use *text* for italics)' },
    subtitle: { type: 'string', label: 'Subtitle' },
    primaryButtonText: { type: 'string', label: 'Primary Button Text' },
    primaryButtonLink: { type: 'string', label: 'Primary Button Link' },
    secondaryButtonText: { type: 'string', label: 'Secondary Button Text' },
    secondaryButtonLink: { type: 'string', label: 'Secondary Button Link' },
    image: { type: 'string', label: 'Image URL' },
  },
  defaultSettings: {
    height: '85vh',
    align: 'left',
    theme: 'forest',
  },
  defaultData: {
    title: 'Protection, *Elevated.*',
    subtitle: 'Bespoke coverage for your most valued assets. Experience an unparalleled standard of security and white-glove service tailored exclusively to your lifestyle.',
    primaryButtonText: 'Request a Consultation',
    primaryButtonLink: '/consultation',
    secondaryButtonText: 'Discover Our Philosophy',
    secondaryButtonLink: '/about',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
