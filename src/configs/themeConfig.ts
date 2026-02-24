// Type Imports
import type { Layout, Skin } from '@/types/core'

export type Config = {
  templateName: string
  homePageUrl: string
  settingsCookieName: string
  layout: Layout
  skin: Skin
}

const themeConfig: Config = {
  templateName: 'BFG',
  homePageUrl: '/',
  settingsCookieName: 'bfg-layout-settings',
  layout: 'vertical', // 'vertical' | 'collapsed' | 'horizontal'
  skin: 'default' // 'default' | 'bordered'
}

export default themeConfig

