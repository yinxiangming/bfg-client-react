import type { ConsoleWorkspaceStatus } from '@/services/console'

/** The tone a workspace's status is shown in, the same on every console page. */
export const WORKSPACE_STATUS_COLOR: Record<ConsoleWorkspaceStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  scheduled_for_deletion: 'warning',
  suspended: 'error',
  inactive: 'default'
}
