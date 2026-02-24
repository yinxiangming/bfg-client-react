import type { BlockDefinition } from '../../../types'
import CtaBlockV1 from './index'

export const definition: BlockDefinition = {
  type: 'cta_block_v1',
  name: 'CTA Block',
  category: 'content',
  thumbnail: '/blocks/thumbnails/cta-block-v1.png',
  description: 'Call-to-action block with title, description and button',

  settingsSchema: {
    variant: {
      type: 'select',
      default: 'primary',
      label: 'Button variant',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    size: {
      type: 'select',
      default: 'medium',
      label: 'Button size',
      options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ],
    },
  },

  dataSchema: {
    title: { type: 'object', label: 'Title' },
    description: { type: 'object', label: 'Description' },
    buttonText: { type: 'object', label: 'Button text' },
    buttonLink: { type: 'string', label: 'Button URL' },
  },

  defaultSettings: { variant: 'primary', size: 'medium' },
  defaultData: { title: {}, description: {}, buttonText: {}, buttonLink: '#' },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
