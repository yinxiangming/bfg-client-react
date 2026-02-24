import type { BlockDefinition } from '../../../types'

export const definition: BlockDefinition = {
  type: 'product_grid_v1',
  name: 'Product Grid',
  category: 'list',
  thumbnail: '/blocks/thumbnails/product-grid-v1.png',
  description: 'Display products in a grid layout with filtering options',

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
      label: 'Max Products',
      label_zh: '最大商品数',
    },
    showTitle: {
      type: 'boolean',
      default: true,
      label: 'Show Section Title',
      label_zh: '显示标题',
    },
    altBackground: {
      type: 'boolean',
      default: false,
      label: 'Alternative Background',
      label_zh: '使用备用背景色',
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
    productType: {
      type: 'select',
      default: 'featured',
      label: 'Product Type',
      label_zh: '商品类型',
      options: [
        { label: 'Featured Products', value: 'featured' },
        { label: 'New Products', value: 'new' },
        { label: 'Bestseller Products', value: 'bestseller' },
        { label: 'All Products', value: 'all' },
      ],
    },
    title: {
      type: 'object',
      label: 'Section Title',
      label_zh: '标题',
    },
    emptyMessage: {
      type: 'object',
      label: 'Empty Message',
      label_zh: '空数据提示',
    },
    products: {
      type: 'array',
      label: 'Products (for manual mode)',
      label_zh: '商品列表（手动模式）',
    },
  },

  defaultSettings: {
    columns: 4,
    limit: 8,
    showTitle: true,
    altBackground: false,
  },

  defaultData: {
    source: 'auto',
    productType: 'featured',
    title: { en: 'Featured Products', zh: '精选商品' },
    emptyMessage: { en: 'No products available', zh: '暂无商品' },
    products: [],
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
