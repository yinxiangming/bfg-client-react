import type React from 'react'
import type { ReactNode } from 'react'
import { getTargetSlot, type PageSlotExtension } from '@/extensions/registry'

export type TabLabelResolver = string | ((t: (key: string) => string) => string)

export type DefaultTabDefinition = {
  key: string
  label: string
  render: () => ReactNode
}

export type ExtensionTabComponent = React.ComponentType<any> & {
  tabLabel?: TabLabelResolver
}

export type BuildTabbedPageTabsOptions = {
  defaultTabs: DefaultTabDefinition[]
  tabExtensions: PageSlotExtension[]
  getAnchorSlotId: (tabKey: string) => string
  translate: (key: string) => string
  extensionProps?: Record<string, any>
}

export type SplitTabbedPageExtensionsResult = {
  tabExtensions: PageSlotExtension[]
  panelExtensions: PageSlotExtension[]
}

export function splitTabbedPageExtensions(afterSlots: PageSlotExtension[]): SplitTabbedPageExtensionsResult {
  return {
    tabExtensions: afterSlots.filter(ext => ext.component && getTargetSlot(ext)),
    panelExtensions: afterSlots.filter(ext => ext.component && !getTargetSlot(ext)),
  }
}

export function buildTabbedPageTabs({
  defaultTabs,
  tabExtensions,
  getAnchorSlotId,
  translate,
  extensionProps = {},
}: BuildTabbedPageTabsOptions): DefaultTabDefinition[] {
  return defaultTabs.flatMap(tab => {
    const injected = tabExtensions
      .filter(ext => getTargetSlot(ext) === getAnchorSlotId(tab.key))
      .map(ext => {
        const Component = ext.component as ExtensionTabComponent
        const label =
          typeof Component?.tabLabel === 'function'
            ? Component.tabLabel(translate)
            : Component?.tabLabel || Component?.displayName || ext.id

        return {
          key: ext.id,
          label,
          render: () => (Component ? <Component {...extensionProps} /> : null),
        }
      })

    return [tab, ...injected]
  })
}
