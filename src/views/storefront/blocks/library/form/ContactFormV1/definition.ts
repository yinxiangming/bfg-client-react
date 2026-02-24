import type { BlockDefinition } from '../../../types'
import ContactFormV1 from './index'

export const definition: BlockDefinition = {
  type: 'contact_form_v1',
  name: 'Contact Form',
  category: 'form',
  thumbnail: '/blocks/thumbnails/contact-form-v1.png',
  description: 'Contact form for customer inquiries, bookings, and feedback',

  settingsSchema: {
    inquiryType: {
      type: 'select',
      default: 'inquiry',
      label: 'Inquiry Type',
      label_zh: '咨询类型',
      options: [
        { label: 'General Inquiry', value: 'inquiry' },
        { label: 'Booking Request', value: 'booking' },
        { label: 'Feedback', value: 'feedback' },
        { label: 'Other', value: 'other' },
      ],
    },
    showPhone: {
      type: 'boolean',
      default: true,
      label: 'Show Phone Field',
      label_zh: '显示电话字段',
    },
    showSubject: {
      type: 'boolean',
      default: true,
      label: 'Show Subject Field',
      label_zh: '显示主题字段',
    },
    buttonVariant: {
      type: 'select',
      default: 'primary',
      label: 'Button Style',
      label_zh: '按钮样式',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Outline', value: 'outline' },
      ],
    },
  },

  dataSchema: {
    title: {
      type: 'object',
      label: 'Title',
      label_zh: '标题',
    },
    description: {
      type: 'object',
      label: 'Description',
      label_zh: '描述',
    },
    successMessage: {
      type: 'object',
      label: 'Success Message',
      label_zh: '成功提示',
    },
    buttonText: {
      type: 'object',
      label: 'Button Text',
      label_zh: '按钮文字',
    },
  },

  defaultSettings: {
    inquiryType: 'inquiry',
    showPhone: true,
    showSubject: true,
    buttonVariant: 'primary',
  },

  defaultData: {
    title: { en: 'Contact Us', zh: '联系我们' },
    description: { en: 'We would love to hear from you!', zh: '期待您的来信！' },
    successMessage: {
      en: 'Thank you! We will get back to you soon.',
      zh: '感谢您的留言！我们会尽快回复您。',
    },
    buttonText: { en: 'Send Message', zh: '发送消息' },
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
