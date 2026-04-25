import { hasPermission, type PermissionMap } from '@/utils/permissions'
import { isMenuSection, isMenuSubMenu, type MenuNode } from '@/types/menu'

export interface NavAccess {
  /** True if the active staff member has the admin role. */
  isAdmin: boolean
  /** Permission map from `staff_member.role.permissions`, or `null` for non-staff. */
  permissions: PermissionMap | null
}

/**
 * Recursively filter a nav tree by the active staff member's access.
 *
 * Rules:
 * - A leaf with `requireAdmin: true` is dropped unless `isAdmin`.
 * - A leaf with `permission: <key>` is dropped unless the permissions map grants it.
 * - Submenus and sections are first filtered children-first; if the same gates
 *   are set on the parent, they apply to the parent too. A submenu/section that
 *   ends up with no children is dropped.
 *
 * Non-staff (no permissions map) sees no permission-gated items, but still sees
 * ungated items — gating decisions for non-staff happen at the page level.
 */
export function filterNavByAccess(items: MenuNode[], access: NavAccess): MenuNode[] {
  const out: MenuNode[] = []
  for (const node of items) {
    if (isMenuSection(node)) {
      const children = filterNavByAccess(node.children, access)
      if (children.length === 0) continue
      out.push({ ...node, children })
      continue
    }
    if (!isAllowed(node, access)) continue
    if (isMenuSubMenu(node)) {
      const children = filterNavByAccess(node.children, access)
      if (children.length === 0) continue
      out.push({ ...node, children })
      continue
    }
    out.push(node)
  }
  return out
}

function isAllowed(
  node: { requireAdmin?: boolean; permission?: string },
  access: NavAccess,
): boolean {
  if (node.requireAdmin && !access.isAdmin) return false
  if (node.permission) {
    if (!access.permissions) return false
    if (!hasPermission(access.permissions, node.permission)) return false
  }
  return true
}
