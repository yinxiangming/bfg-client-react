export interface PermissionAction {
  key: string
  /** Translation key under `staff.permissions.actions.<key>` in the admin namespace. */
  i18nKey: string
}

export interface PermissionModule {
  key: string
  /** Translation key under `staff.permissions.modules.<dottedKey>` in the admin namespace. */
  i18nKey: string
  /** Group identifier; rendered via `staff.permissions.groups.<group>`. */
  group: string
}

export const PERMISSION_ACTIONS: PermissionAction[] = [
  { key: 'view', i18nKey: 'view' },
  { key: 'list', i18nKey: 'list' },
  { key: 'create', i18nKey: 'create' },
  { key: 'update', i18nKey: 'update' },
  { key: 'delete', i18nKey: 'delete' },
]

export const PERMISSION_MODULES: PermissionModule[] = [
  { key: 'shop.product', i18nKey: 'shop.product', group: 'shop' },
  { key: 'shop.order', i18nKey: 'shop.order', group: 'shop' },
  { key: 'shop.customer', i18nKey: 'shop.customer', group: 'shop' },
  { key: 'shop.category', i18nKey: 'shop.category', group: 'shop' },

  { key: 'delivery', i18nKey: 'delivery', group: 'delivery' },

  { key: 'finance.invoice', i18nKey: 'finance.invoice', group: 'finance' },
  { key: 'finance.payment', i18nKey: 'finance.payment', group: 'finance' },

  { key: 'marketing', i18nKey: 'marketing', group: 'marketing' },

  { key: 'web', i18nKey: 'web', group: 'content' },

  { key: 'support', i18nKey: 'support', group: 'support' },
]

export function groupModules(): { group: string; modules: PermissionModule[] }[] {
  const map = new Map<string, PermissionModule[]>()
  for (const mod of PERMISSION_MODULES) {
    if (!map.has(mod.group)) map.set(mod.group, [])
    map.get(mod.group)!.push(mod)
  }
  return Array.from(map.entries()).map(([group, modules]) => ({ group, modules }))
}

export function matrixToPermissions(
  matrix: Record<string, Set<string>>
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [moduleKey, actions] of Object.entries(matrix)) {
    const list = Array.from(actions)
    if (list.length === 0) continue
    result[moduleKey] = list.length === PERMISSION_ACTIONS.length ? ['*'] : list
  }
  return result
}

export function permissionsToMatrix(
  permissions: Record<string, string[] | boolean>
): Record<string, Set<string>> {
  const allActions = PERMISSION_ACTIONS.map((a) => a.key)
  const matrix: Record<string, Set<string>> = {}
  for (const mod of PERMISSION_MODULES) {
    matrix[mod.key] = new Set()
  }
  for (const [moduleKey, value] of Object.entries(permissions)) {
    if (moduleKey === '*') {
      const actions =
        value === true || (Array.isArray(value) && value.includes('*'))
          ? allActions
          : Array.isArray(value)
          ? value
          : []
      for (const mod of PERMISSION_MODULES) {
        matrix[mod.key] = new Set(actions)
      }
      continue
    }
    const targets = PERMISSION_MODULES.filter(
      (m) => m.key === moduleKey || m.key.startsWith(moduleKey + '.')
    )
    const actions =
      value === true || (Array.isArray(value) && value.includes('*'))
        ? allActions
        : Array.isArray(value)
        ? value
        : []
    for (const t of targets) {
      matrix[t.key] = new Set(actions)
    }
  }
  return matrix
}
