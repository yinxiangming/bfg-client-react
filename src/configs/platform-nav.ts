/**
 * Platform admin navigation items.
 * Injected into the admin sidebar via the extension system.
 */
import type { NavExtension } from '@/extensions/registry'

export const platformAdminNav: NavExtension[] = [
  {
    id: 'platform-nav',
    position: 'after',
    targetId: 'admin-nav-settings',
    items: [
      {
        id: 'platform-root',
        label: 'Platform',
        icon: 'Building2',
        href: '/admin/platform',
        children: [
          {
            id: 'platform-workspaces',
            label: 'Workspaces',
            href: '/admin/platform/workspaces',
          },
          {
            id: 'platform-plans',
            label: 'Plans & Billing',
            href: '/admin/platform/plans',
          },
          {
            id: 'platform-sso',
            label: 'SSO Configs',
            href: '/admin/platform/sso',
          },
          {
            id: 'platform-clusters',
            label: 'Clusters',
            href: '/admin/platform/clusters',
          },
        ],
      },
    ],
  },
]
