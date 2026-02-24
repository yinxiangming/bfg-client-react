import type { BlockConfig } from '@/views/common/blocks'

export interface DashboardLayout {
  left: BlockConfig[]
  right: BlockConfig[]
}

/** Default dashboard: left (wide) and right (narrow) columns */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  left: [
    { id: 'block_default_store_stats', type: 'store_stats', settings: {}, data: {} },
    { id: 'block_default_orders_chart', type: 'store_orders_chart', settings: {}, data: {} },
  ],
  right: [],
}

/** Migrate legacy layout (BlockConfig[]) to DashboardLayout */
export function normalizeDashboardLayout(raw: unknown): DashboardLayout {
  if (raw && typeof raw === 'object' && 'left' in raw && 'right' in raw) {
    const o = raw as { left?: unknown; right?: unknown }
    return {
      left: Array.isArray(o.left) ? o.left : [],
      right: Array.isArray(o.right) ? o.right : [],
    }
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return { left: raw as BlockConfig[], right: [] }
  }
  return DEFAULT_DASHBOARD_LAYOUT
}
