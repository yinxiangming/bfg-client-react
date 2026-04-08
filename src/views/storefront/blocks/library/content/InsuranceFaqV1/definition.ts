import { BlockDefinition } from '../../../types'
import InsuranceFaqV1 from './index'

export const definition: BlockDefinition = {
  type: 'insurance_faq_v1',
  name: 'Insurance FAQ V1',
  category: 'content',
  description: 'Accordion style FAQ section',
  settingsSchema: {
    theme: {
      type: 'select',
      label: 'Theme',
      default: 'light',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Gray', value: 'gray' },
      ],
    },
  },
  dataSchema: {
    title: { type: 'string', label: 'Section Title' },
    subtitle: { type: 'string', label: 'Section Subtitle' },
    faqs: { type: 'array', label: 'FAQs' },
  },
  defaultSettings: {
    theme: 'light',
  },
  defaultData: {
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know about our coverage.',
    faqs: [
      {
        question: 'How do I file a claim?',
        answer: 'Filing a claim is easy and paperless. You can submit your claim through our mobile app or website 24/7. Simply log in to your account, click on "File a Claim", and follow the step-by-step instructions. You can upload photos directly from your phone.',
      },
      {
        question: 'How long does the quote process take?',
        answer: 'Our digital quote process typically takes less than 2 minutes. We use smart technology to gather necessary information quickly, meaning fewer questions for you and instant coverage options.',
      },
      {
        question: 'Can I customize my coverage limits?',
        answer: 'Absolutely. We believe in personalized coverage. Once you receive your initial quote, you can easily adjust your deductibles and coverage limits using our interactive sliders to see how it affects your premium in real-time.',
      },
      {
        question: 'What discounts are available?',
        answer: 'We offer multiple ways to save, including multi-policy discounts, safe driver rewards, claims-free bonuses, and discounts for home security systems. Your quote will automatically apply all discounts you qualify for.',
      },
    ],
  },
}

export { default as Component } from './index'
export const SettingsEditor = undefined
