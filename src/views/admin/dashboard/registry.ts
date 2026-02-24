/**
 * Dashboard block registry: aggregates core blocks + Extension.dashboardBlocks.
 */

import type { Extension } from '@/extensions/registry'
import type {
  BlockDefinition,
  BlockComponent,
  BlockSettingsComponent,
  BlockRegistryEntry,
} from '@/views/common/blocks'
import { coreDashboardBlocks } from './blocks/store'

const registry = new Map<string, BlockRegistryEntry>()
const definitions: BlockDefinition[] = []

function registerEntry(entry: BlockRegistryEntry) {
  if (!entry.definition?.type) return
  registry.set(entry.definition.type, entry)
  definitions.push(entry.definition)
}

export function buildDashboardBlockRegistry(extensions: Extension[]): void {
  registry.clear()
  definitions.length = 0

  coreDashboardBlocks.forEach(registerEntry)
  extensions.forEach((ext) => {
    ;(ext.dashboardBlocks || []).forEach(registerEntry)
  })
}

export function getDashboardBlocksByCategory(): Record<string, BlockDefinition[]> {
  const grouped: Record<string, BlockDefinition[]> = {}
  for (const def of definitions) {
    const cat = def.category || 'system'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(def)
  }
  return grouped
}

export function getDashboardBlockDefinition(type: string): BlockDefinition | null {
  return registry.get(type)?.definition ?? null
}

export function getDashboardBlockComponent(type: string): BlockComponent | null {
  return registry.get(type)?.Component ?? null
}

export function getDashboardBlockSettingsEditor(type: string): BlockSettingsComponent | null {
  return registry.get(type)?.SettingsEditor ?? null
}
