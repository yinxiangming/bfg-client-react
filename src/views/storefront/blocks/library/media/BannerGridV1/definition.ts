import type { BlockDefinition } from '../../../types'

export const definition: BlockDefinition = {
  type: 'banner_grid_v1',
  name: 'Banner Grid',
  category: 'media',
  thumbnail: '/blocks/thumbnails/banner-grid-v1.png',
  description: 'Display promotional banners in a grid layout',

  settingsSchema: {
    columns: {
      type: 'integer',
      default: 3,
      label: 'Columns',
      label_zh: '列数',
    },
    imageHeight: {
      type: 'string',
      default: '240px',
      label: 'Image Height',
      label_zh: '图片高度',
    },
    showOverlay: {
      type: 'boolean',
      default: true,
      label: 'Show Gradient Overlay',
      label_zh: '显示渐变遮罩',
    },
  },

  dataSchema: {
    banners: {
      type: 'array',
      required: true,
      label: 'Banners',
      label_zh: '横幅列表',
    },
  },

  defaultSettings: {
    columns: 3,
    imageHeight: '240px',
    showOverlay: true,
  },

  defaultData: {
    banners: [
      {
        image: '/placeholder-banner.jpg',
        title: { en: 'Banner 1', zh: '横幅 1' },
        link: '/category/bags',
      },
      {
        image: '/placeholder-banner.jpg',
        title: { en: 'Banner 2', zh: '横幅 2' },
        link: '/category/watches',
      },
      {
        image: '/placeholder-banner.jpg',
        title: { en: 'Banner 3', zh: '横幅 3' },
        link: '/category/shoes',
      },
    ],
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
