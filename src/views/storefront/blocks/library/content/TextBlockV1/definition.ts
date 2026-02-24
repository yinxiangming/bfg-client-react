import type { BlockDefinition } from '../../../types'
import TextBlockV1 from './index'

export const definition: BlockDefinition = {
  type: 'text_block_v1',
  name: 'Text Block',
  category: 'content',
  thumbnail: '/blocks/thumbnails/text-block-v1.png',
  description: 'Rich text content block with customizable styling',

  settingsSchema: {
    align: {
      type: 'select',
      default: 'left',
      label: 'Text Alignment',
      label_zh: '文字对齐',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
    maxWidth: {
      type: 'string',
      default: '800px',
      label: 'Max Width',
      label_zh: '最大宽度',
    },
    backgroundColor: {
      type: 'string',
      label: 'Background Color',
      label_zh: '背景颜色',
    },
  },

  dataSchema: {
    title: {
      type: 'object',
      label: 'Title',
      label_zh: '标题',
    },
    content: {
      type: 'object',
      required: true,
      label: 'Content (HTML)',
      label_zh: '内容 (HTML)',
    },
  },

  defaultSettings: {
    align: 'left',
    maxWidth: '800px',
  },

  defaultData: {
    title: { en: '', zh: '' },
    content: {
      en: '<p>Enter your content here...</p>',
      zh: '<p>在此输入内容...</p>',
    },
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
