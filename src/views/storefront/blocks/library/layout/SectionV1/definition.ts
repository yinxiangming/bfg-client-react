import type { BlockDefinition } from '../../../types'

export const definition: BlockDefinition = {
  type: 'section_v1',
  name: 'Section (Container)',
  category: 'layout',
  description: 'Wraps child blocks in a fixed-width container or full width',

  settingsSchema: {},

  dataSchema: {
    width: {
      type: 'string',
      default: 'container',
      label: 'Width',
      label_zh: '宽度',
    },
    children: {
      type: 'array',
      label: 'Child blocks',
      label_zh: '子区块',
    },
  },

  defaultSettings: {},
  defaultData: {
    width: 'container',
    children: [],
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
