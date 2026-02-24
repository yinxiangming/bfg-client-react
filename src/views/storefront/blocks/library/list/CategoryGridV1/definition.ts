import type { BlockDefinition } from '../../../types'

export const definition: BlockDefinition = {
  type: 'category_grid_v1',
  name: 'Category Grid',
  category: 'list',
  thumbnail: '/blocks/thumbnails/category-grid-v1.png',
  description: 'Display product categories in a grid layout',

  settingsSchema: {
    columns: {
      type: 'integer',
      default: 4,
      label: 'Columns',
      label_zh: '列数',
    },
    limit: {
      type: 'integer',
      default: 8,
      label: 'Max Categories',
      label_zh: '最大分类数',
    },
    showCount: {
      type: 'boolean',
      default: true,
      label: 'Show Product Count',
      label_zh: '显示商品数量',
    },
    imageHeight: {
      type: 'string',
      default: '180px',
      label: 'Image Height',
      label_zh: '图片高度',
    },
  },

  dataSchema: {
    source: {
      type: 'select',
      default: 'auto',
      label: 'Data Source',
      label_zh: '数据来源',
      options: [
        { label: 'Auto (fetch from API)', value: 'auto' },
        { label: 'Manual (specify items)', value: 'manual' },
      ],
    },
    categories: {
      type: 'array',
      label: 'Categories (for manual mode)',
      label_zh: '分类列表（手动模式）',
    },
  },

  defaultSettings: {
    columns: 4,
    limit: 8,
    showCount: true,
    imageHeight: '180px',
  },

  defaultData: {
    source: 'auto',
    categories: [],
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
