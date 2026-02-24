import type { MenuNode } from '@/types/menu'
import type { NavExtension } from '../registry'

export function applyNavExtensions(
  baseItems: MenuNode[],
  extensions: NavExtension[],
  defaultPriority: number = 100
): MenuNode[] {
  // 1. 按 priority 排序（高优先级先处理）
  const sorted = [...extensions].sort((a, b) =>
    (b.priority ?? defaultPriority) - (a.priority ?? defaultPriority)
  )

  // 2. 收集 hide 目标
  const hiddenIds = new Set<string>()
  for (const ext of sorted) {
    if (ext.position === 'hide' && ext.targetId) {
      // 检查条件
      if (!ext.condition || ext.condition()) {
        hiddenIds.add(ext.targetId)
      }
    }
  }

  // 3. 收集 replace 目标（只有最高优先级的生效）
  const replaceMap = new Map<string, NavExtension>()
  for (const ext of sorted) {
    if (ext.position === 'replace' && ext.targetId) {
      if (!replaceMap.has(ext.targetId) && (!ext.condition || ext.condition())) {
        replaceMap.set(ext.targetId, ext)
      }
    }
  }

  // 4. 递归过滤和替换
  const processItems = (items: MenuNode[]): MenuNode[] => {
    return items
      .filter(item => !hiddenIds.has(item.id))
      .map(item => {
        // 检查是否需要替换
        const replacement = replaceMap.get(item.id)
        if (replacement?.items?.[0]) {
          return replacement.items[0]
        }
        // 递归处理子菜单
        if ('children' in item && item.children) {
          return { ...item, children: processItems(item.children) }
        }
        return item
      })
  }

  let result = processItems(baseItems)

  // 5. 应用 before/after
  for (const ext of sorted) {
    if ((ext.position === 'before' || ext.position === 'after') && ext.items) {
      if (ext.condition && !ext.condition()) continue
      
      let targetFound = false
      
      const insertItems = (items: MenuNode[]): MenuNode[] => {
        const newItems: MenuNode[] = []
        
        for (const item of items) {
          if (item.id === ext.targetId) {
            targetFound = true
            if (ext.position === 'before') {
              newItems.push(...ext.items!, item)
            } else {
              newItems.push(item, ...ext.items!)
            }
          } else {
            if ('children' in item && item.children) {
              const processedChildren = insertItems(item.children)
              newItems.push({ ...item, children: processedChildren })
            } else {
              newItems.push(item)
            }
          }
        }
        
        return newItems
      }
      
      result = insertItems(result)
      
      // Log warning if target not found
      if (!targetFound && process.env.NODE_ENV === 'development' && ext.targetId) {
        console.warn(`[applyNavExtensions] Target ID "${ext.targetId}" not found. Available IDs:`, 
          result.map(item => item.id).join(', '))
      }
    }
  }

  return result
}
