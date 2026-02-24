import type { BlockRegistryEntry } from '@/views/common/blocks'
import { resaleBookingsChartEntry } from './ResaleBookingsChart'

/** Dashboard blocks for resale – registered via Extension.dashboardBlocks */
export const resaleDashboardBlocks: BlockRegistryEntry[] = [resaleBookingsChartEntry]
