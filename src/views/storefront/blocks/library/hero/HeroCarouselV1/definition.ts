import type { BlockDefinition } from '../../../types'
import HeroCarouselV1 from './index'

export const definition: BlockDefinition = {
  type: 'hero_carousel_v1',
  name: 'Hero Carousel',
  category: 'hero',
  thumbnail: '/blocks/thumbnails/hero-carousel-v1.png',
  description: 'Full-width image carousel with text overlay and call-to-action buttons',

  settingsSchema: {
    autoPlay: {
      type: 'boolean',
      default: true,
      label: 'Auto Play',
      label_zh: '自动播放',
    },
    interval: {
      type: 'integer',
      default: 5000,
      label: 'Interval (ms)',
      label_zh: '切换间隔 (毫秒)',
    },
    showArrows: {
      type: 'boolean',
      default: true,
      label: 'Show Arrows',
      label_zh: '显示箭头',
    },
    showDots: {
      type: 'boolean',
      default: true,
      label: 'Show Dots',
      label_zh: '显示指示点',
    },
    height: {
      type: 'string',
      default: '500px',
      label: 'Height',
      label_zh: '高度',
    },
  },

  dataSchema: {
    slides: {
      type: 'array',
      required: true,
      label: 'Slides',
      label_zh: '幻灯片',
    },
  },

  defaultSettings: {
    autoPlay: true,
    interval: 5000,
    showArrows: true,
    showDots: true,
    height: '500px',
  },

  defaultData: {
    slides: [
      {
        image: '/placeholder-hero.jpg',
        title: { en: 'Welcome to Our Store', zh: '欢迎来到我们的商店' },
        subtitle: { en: 'Discover amazing products', zh: '发现精彩产品' },
        buttonText: { en: 'Shop Now', zh: '立即购买' },
        buttonLink: '/products',
      },
    ],
  },
}

export { default as Component } from './index'

// Settings editor will use default SchemaConfigEditor
export const SettingsEditor = undefined
