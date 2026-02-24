'use client'

// React Imports
import { useState, useEffect, useCallback, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Component Imports
import Icon from '@components/Icon'
import Logo from '@components/Logo'

// i18n Imports
import { useTranslations } from 'next-intl'

// Type Imports
import type { MenuNode } from '@/types/menu'
import { isMenuSection, isMenuSubMenu, isMenuItem } from '@/types/menu'

const normalizePath = (path?: string | null) => {
  if (!path) return path

  // Strip optional locale prefix such as /en or /zh-CN to keep matching stable
  // Only match short locale codes (2-5 chars with optional region like zh-CN)
  return path.replace(/^\/[a-z]{2}(-[A-Z]{2})?(?=\/|$)/, '') || '/'
}

type Props = {
  navItems: MenuNode[]
  activePath?: string | null
  collapsed?: boolean
  onToggleCollapse?: () => void
  mobileOpen?: boolean
}

type OpenSubmenuState = {
  [key: string]: boolean
}

const Sidebar = ({ navItems, activePath, collapsed = false, onToggleCollapse, mobileOpen = false }: Props) => {
  const pathname = usePathname()
  const currentPath = activePath || pathname
  const normalizedPath = useMemo(() => normalizePath(currentPath), [currentPath])
  const [openSubmenus, setOpenSubmenus] = useState<OpenSubmenuState>({})

  const i18nNamespace = useMemo(() => {
    if (normalizedPath?.startsWith('/admin')) return 'admin'
    if (normalizedPath?.startsWith('/account')) return 'account'
    return 'common'
  }, [normalizedPath])

  const t = useTranslations(i18nNamespace as any)

  const getLabel = (node: MenuNode) => {
    const key = (node as any).i18nKey as string | undefined
    if (!key) return node.label
    const has = (t as any).has ? (t as any).has(key) : true
    if (!has) return node.label
    return t(key) as unknown as typeof node.label
  }

  const handleItemClick = () => {
    if (mobileOpen && onToggleCollapse) {
      onToggleCollapse()
    }
  }

  // Check if a path matches the current path
  const isActive = useCallback(
    (href?: string, exactMatch = true, activeUrl?: string) => {
      if (!href) return false

      const pathToCheck = normalizedPath || currentPath
      const hrefToCheck = normalizePath(href)
      const activeUrlToCheck = activeUrl ? normalizePath(activeUrl) : undefined

      // Priority 1: Check activeUrl if provided
      if (activeUrlToCheck) {
        return Boolean(pathToCheck && pathToCheck.includes(activeUrlToCheck))
      }

      // Priority 2: Check exact match (default behavior)
      if (exactMatch !== false) {
        // First try exact match
        if (pathToCheck === hrefToCheck) {
          return true
        }
        // If no exact match, try prefix match (current path starts with href)
        // Ensure href is followed by '/' to avoid partial matches
        // e.g., /admin/store/products should match /admin/store/products/83/edit
        // but /admin/store/product should NOT match /admin/store/products
        if (pathToCheck && hrefToCheck) {
          return pathToCheck.startsWith(hrefToCheck + '/')
        }
        return false
      }

      // Priority 3: Check prefix match when exactMatch is false
      return Boolean(pathToCheck && hrefToCheck && pathToCheck.startsWith(hrefToCheck))
    },
    [currentPath, normalizedPath]
  )

  // Check if any child is active
  const hasActiveChild = useCallback(
    (children: MenuNode[]): boolean => {
      return children.some(child => {
        if (isMenuItem(child) && child.href) {
          return isActive(child.href, child.exactMatch, child.activeUrl)
        }
        if (isMenuSubMenu(child)) {
          return hasActiveChild(child.children)
        }
        if (isMenuSection(child)) {
          return hasActiveChild(child.children)
        }
        return false
      })
    },
    [isActive]
  )

  // Initialize open submenus based on active path
  useEffect(() => {
    const nextState: OpenSubmenuState = {}

    const findAndOpenActiveParents = (items: MenuNode[], parentIds: string[] = []): void => {
      items.forEach(item => {
        if (isMenuSubMenu(item)) {
          const itemPath = [...parentIds, item.id]
          const itemId = itemPath.join('-')

          if (hasActiveChild(item.children)) {
            nextState[itemId] = true
          }

          findAndOpenActiveParents(item.children, itemPath)
        } else if (isMenuSection(item)) {
          findAndOpenActiveParents(item.children, parentIds)
        }
      })
    }

    findAndOpenActiveParents(navItems)
    setOpenSubmenus(nextState)
  }, [navItems, hasActiveChild, currentPath])

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const renderBadge = (badge?: { label: string | number; color?: string }) => {
    if (!badge) return null

    const colorClass = badge.color ? `badge-${badge.color}` : 'badge-default'
    return (
      <span className={`menu-badge ${colorClass}`}>
        {badge.label}
      </span>
    )
  }

  const renderMenuItem = (item: MenuNode, level: number = 0, parentId: string = '') => {
    const itemId = parentId ? `${parentId}-${item.id}` : item.id

    if (isMenuSection(item)) {
      return (
        <div key={item.id} className='menu-section'>
          <div className='menu-section-label'>{getLabel(item)}</div>
          <ul className='menu-section-list'>
            {item.children.map(child => renderMenuItem(child, level, itemId))}
          </ul>
        </div>
      )
    }

    if (isMenuSubMenu(item)) {
      const isOpen = openSubmenus[itemId] || false
      const hasActive = hasActiveChild(item.children)

      return (
        <li key={item.id} className={`menu-submenu ${isOpen ? 'open' : ''} ${hasActive ? 'has-active' : ''}`}>
          <button
            type='button'
            className={`menu-submenu-button level-${level}`}
            onClick={() => toggleSubmenu(itemId)}
            disabled={item.disabled}
          >
            {item.icon && (
              <span className='menu-icon'>
                <Icon icon={item.icon} />
              </span>
            )}
            {!collapsed && <span className='menu-label'>{getLabel(item)}</span>}
            {!collapsed && item.suffix && renderBadge(item.suffix)}
            {!collapsed && (
              <span className={`menu-expand-icon ${isOpen ? 'open' : ''}`}>
                <Icon icon='tabler-chevron-right' />
              </span>
            )}
          </button>
          {!collapsed && (
            <ul className={`menu-submenu-children level-${level + 1} ${isOpen ? 'open' : ''}`}>
              {item.children.map(child => renderMenuItem(child, level + 1, itemId))}
            </ul>
          )}
        </li>
      )
    }

    if (isMenuItem(item)) {
      const active = item.href ? isActive(item.href, item.exactMatch, item.activeUrl) : false

      return (
        <li key={item.id} className={`menu-item level-${level}`}>
          {item.href ? (
            <Link href={item.href} className={`menu-link level-${level} ${active ? 'active' : ''}`} onClick={handleItemClick}>
              {item.icon && (
                <span className='menu-icon'>
                  <Icon icon={item.icon} />
                </span>
              )}
              {!collapsed && <span className='menu-label'>{getLabel(item)}</span>}
              {!collapsed && item.suffix && renderBadge(item.suffix)}
            </Link>
          ) : (
            <span className={`menu-link level-${level} ${item.disabled ? 'disabled' : ''}`}>
              {item.icon && (
                <span className='menu-icon'>
                  <Icon icon={item.icon} />
                </span>
              )}
              {!collapsed && <span className='menu-label'>{getLabel(item)}</span>}
              {!collapsed && item.suffix && renderBadge(item.suffix)}
            </span>
          )}
        </li>
      )
    }

    return null
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className='sidebar-header'>
        <div className='sidebar-logo'>
          <Logo />
        </div>
        {onToggleCollapse && (
          <button
            type='button'
            className='sidebar-lock-btn'
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Unlock sidebar' : 'Lock sidebar'}
            title={collapsed ? 'Unlock sidebar' : 'Lock sidebar'}
          >
            <Icon icon={collapsed ? 'tabler-lock-open' : 'tabler-lock'} />
          </button>
        )}
      </div>
      <nav className='sidebar-nav'>
        <ul className='menu-list'>
          {navItems.map(item => renderMenuItem(item))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
