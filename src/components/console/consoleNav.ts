/**
 * The console's tree: the workspaces the account owns, each with its own pages, plus the
 * platform's own group for a platform administrator.
 *
 * Only an owner can manage a workspace here, so a workspace the account merely works in
 * has no node of its own; it is on the list page, which opens its admin. Usage, bills and
 * platform settings are phase 3, and sit in the tree disabled so its final shape is
 * already visible.
 */

import type { MenuNode } from '@/types/menu'

export type ConsoleNavLabels = {
  workspaces: string
  myWorkspaces: string
  overview: string
  extensions: string
  usage: string
  billing: string
  bills: string
  platform: string
  allWorkspaces: string
  platformSettings: string
}

export type ConsoleNavWorkspace = { id: number; name: string }

type ConsoleNavOptions = {
  /** The workspaces the account owns. */
  owned: ConsoleNavWorkspace[]
  isPlatformAdmin: boolean
  /** A workspace the account is looking at without owning it. */
  openWorkspace?: ConsoleNavWorkspace | null
  labels: ConsoleNavLabels
}

function workspaceNode(workspace: ConsoleNavWorkspace, prefix: string, labels: ConsoleNavLabels): MenuNode {
  const base = `/workspaces/${workspace.id}`

  return {
    id: `${prefix}-${workspace.id}`,
    label: workspace.name,
    icon: 'tabler-building',
    type: 'submenu',
    // The node is its own overview page: the label navigates, the chevron only expands.
    href: base,
    children: [
      {
        id: `${prefix}-${workspace.id}-overview`,
        label: labels.overview,
        icon: 'tabler-layout-dashboard',
        href: base,
        activeMatch: 'exact'
      },
      {
        id: `${prefix}-${workspace.id}-extensions`,
        label: labels.extensions,
        icon: 'tabler-puzzle',
        href: `${base}/extensions`
      },
      { id: `${prefix}-${workspace.id}-usage`, label: labels.usage, icon: 'tabler-chart-bar', disabled: true }
    ]
  }
}

export function buildConsoleNav({ owned, isPlatformAdmin, openWorkspace, labels }: ConsoleNavOptions): MenuNode[] {
  const nav: MenuNode[] = [
    {
      type: 'section',
      id: 'console-workspaces',
      label: labels.workspaces,
      children: [
        {
          id: 'console-my-workspaces',
          label: labels.myWorkspaces,
          icon: 'tabler-layout-grid',
          href: '/workspaces',
          activeMatch: 'exact'
        },
        ...owned.map(workspace => workspaceNode(workspace, 'ws', labels))
      ]
    },
    {
      type: 'section',
      id: 'console-billing',
      label: labels.billing,
      children: [{ id: 'console-bills', label: labels.bills, icon: 'tabler-file-invoice', disabled: true }]
    }
  ]

  if (!isPlatformAdmin) return nav

  const platformChildren: MenuNode[] = [
    {
      id: 'console-all-workspaces',
      label: labels.allWorkspaces,
      icon: 'tabler-buildings',
      href: '/workspaces/platform',
      activeMatch: 'exact'
    }
  ]

  if (openWorkspace) {
    platformChildren.push(workspaceNode(openWorkspace, 'platform-ws', labels))
  }

  platformChildren.push({
    id: 'console-platform-settings',
    label: labels.platformSettings,
    icon: 'tabler-adjustments',
    disabled: true
  })

  nav.push({ type: 'section', id: 'console-platform', label: labels.platform, children: platformChildren })

  return nav
}
