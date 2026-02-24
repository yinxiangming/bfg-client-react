import type { BlockRegistryEntry } from '@/views/common/blocks'
import { StoreStatsBlock, StoreStatsBlockSettings, definition as storeStatsDef } from './StoreStatsBlock'
import { OrdersChartBlock, OrdersChartBlockSettings, definition as ordersChartDef } from './OrdersChartBlock'

const storeStatsEntry: BlockRegistryEntry = {
  definition: storeStatsDef,
  Component: StoreStatsBlock as any,
  SettingsEditor: StoreStatsBlockSettings as any,
}

const ordersChartEntry: BlockRegistryEntry = {
  definition: ordersChartDef,
  Component: OrdersChartBlock as any,
  SettingsEditor: OrdersChartBlockSettings as any,
}

export const coreDashboardBlocks: BlockRegistryEntry[] = [
  storeStatsEntry,
  ordersChartEntry,
]

export { StoreStatsBlock, OrdersChartBlock }
