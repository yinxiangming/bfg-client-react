// React Imports
import type { ReactNode } from 'react'

// Menu Badge type
export type MenuBadge = {
  label: string | number
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
}

// Base menu item properties
export type MenuItemBase = {
  id: string
  label: ReactNode
  /**
   * Translation key within current app namespace (e.g. 'nav.orders').
   * If provided, UI may render translated label and use `label` as fallback.
   */
  i18nKey?: string
  href?: string
  icon?: string
  suffix?: MenuBadge
  disabled?: boolean
  exactMatch?: boolean
  activeUrl?: string
}

// Leaf menu item (no children)
export type MenuItem = MenuItemBase & {
  type?: 'item'
}

// Submenu (has children)
export type MenuSubMenu = MenuItemBase & {
  type: 'submenu'
  children: MenuNode[]
}

// Section divider
export type MenuSection = {
  type: 'section'
  id: string
  label: ReactNode
  children: MenuNode[]
}

// Union type for all menu nodes
export type MenuNode = MenuItem | MenuSubMenu | MenuSection

// Helper type guard functions
export const isMenuSection = (node: MenuNode): node is MenuSection => {
  return node.type === 'section'
}

export const isMenuSubMenu = (node: MenuNode): node is MenuSubMenu => {
  return node.type === 'submenu' || ('children' in node && !isMenuSection(node))
}

export const isMenuItem = (node: MenuNode): node is MenuItem => {
  return !isMenuSection(node) && !isMenuSubMenu(node)
}
