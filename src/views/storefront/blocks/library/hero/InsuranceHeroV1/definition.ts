import { BlockDefinition } from '../../../../types'
import InsuranceHeroV1 from './index'

export const definition: BlockDefinition = {
  type: 'insurance_hero_v1',
  name: 'Insurance Hero V1 (Editorial)',
  category: 'hero',
  description: 'High-end editorial hero section with majestic typography',
  settingsSchema: {
    type: 'object',
    properties: {
      height: { type: 'string', title: 'Min Height' },
      align: { type: 'string', enum: ['left', 'center'], title: 'Alignment' },
      theme: { type: 'string', enum: ['light', 'dark', 'forest'], title: 'Theme' },
    },
  },
  dataSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', title: 'Title (use *text* for italics)' },
      subtitle: { type: 'string', title: 'Subtitle' },
      primaryButtonText: { type: 'string', title: 'Primary Button Text' },
      primaryButtonLink: { type: 'string', title: 'Primary Button Link' },
      secondaryButtonText: { type: 'string', title: 'Secondary Button Text' },
      secondaryButtonLink: { type: 'string', title: 'Secondary Button Link' },
      image: { type: 'string', title: 'Image URL' },
    },
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
