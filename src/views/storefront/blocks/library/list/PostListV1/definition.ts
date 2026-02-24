import type { BlockDefinition } from '../../../types'
import PostListV1 from './index'

export const definition: BlockDefinition = {
  type: 'post_list_v1',
  name: 'Post List',
  category: 'list',
  thumbnail: '/blocks/thumbnails/post-list-v1.png',
  description: 'Display a grid or list of posts with filtering options',

  settingsSchema: {
    layout: {
      type: 'select',
      default: 'grid',
      label: 'Layout',
      label_zh: '布局',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'List', value: 'list' },
      ],
    },
    columns: {
      type: 'integer',
      default: 3,
      label: 'Columns',
      label_zh: '列数',
    },
    showExcerpt: {
      type: 'boolean',
      default: true,
      label: 'Show Excerpt',
      label_zh: '显示摘要',
    },
    showImage: {
      type: 'boolean',
      default: true,
      label: 'Show Image',
      label_zh: '显示图片',
    },
    showCategory: {
      type: 'boolean',
      default: true,
      label: 'Show Category',
      label_zh: '显示分类',
    },
    showDate: {
      type: 'boolean',
      default: true,
      label: 'Show Date',
      label_zh: '显示日期',
    },
  },

  dataSchema: {
    source: {
      type: 'select',
      default: 'latest',
      label: 'Data Source',
      label_zh: '数据来源',
      options: [
        { label: 'Latest Posts', value: 'latest' },
        { label: 'By Category', value: 'category' },
        { label: 'Manual Selection', value: 'manual' },
      ],
    },
    contentType: {
      type: 'string',
      label: 'Content Type',
      label_zh: '内容类型',
      description: 'Filter by content type (e.g., post, news)',
    },
    categorySlug: {
      type: 'string',
      label: 'Category Slug',
      label_zh: '分类别名',
    },
    limit: {
      type: 'integer',
      default: 6,
      label: 'Limit',
      label_zh: '数量限制',
    },
    title: {
      type: 'object',
      label: 'Section Title',
      label_zh: '区域标题',
    },
    viewAllLink: {
      type: 'string',
      label: 'View All Link',
      label_zh: '查看全部链接',
    },
    viewAllText: {
      type: 'object',
      label: 'View All Text',
      label_zh: '查看全部文字',
    },
  },

  defaultSettings: {
    layout: 'grid',
    columns: 3,
    showExcerpt: true,
    showImage: true,
    showCategory: true,
    showDate: true,
  },

  defaultData: {
    source: 'latest',
    limit: 6,
    title: { en: 'Latest Posts', zh: '最新文章' },
    viewAllLink: '/posts',
    viewAllText: { en: 'View All', zh: '查看全部' },
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
