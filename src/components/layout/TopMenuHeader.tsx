'use client'

// React Imports
import { useState, useCallback, useRef, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// i18n Imports
import { useTranslations } from 'next-intl'

// Component Imports
import Icon from '@components/Icon'

// Type Imports
import type { MenuNode } from '@/types/menu'
import { isMenuSection, isMenuSubMenu, isMenuItem } from '@/types/menu'

type Props = {
  navItems: MenuNode[]
}

type OpenSubmenuState = {
  [key: string]: boolean
}

type SubmenuPosition = {
  [key: string]: 'left' | 'right'
}

const TopMenuHeader = ({ navItems }: Props) => {
  const pathname = usePathname()
  const i18nNamespace = pathname?.startsWith('/admin') ? 'admin' : 'account'
  const t = useTranslations(i18nNamespace as any)
  const [openSubmenus, setOpenSubmenus] = useState<OpenSubmenuState>({})
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)
  const [submenuPositions, setSubmenuPositions] = useState<SubmenuPosition>({})
  const menuItemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const submenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const closeTimeouts = useRef<{ [key: string]: NodeJS.Timeout | null }>({})

  // Check if a path matches the current path
  const isActive = useCallback(
    (href?: string, exactMatch = true, activeUrl?: string) => {
      if (!href) return false
      if (exactMatch) {
        return pathname === href
      }
      if (activeUrl) {
        return pathname?.includes(activeUrl)
      }
      return pathname?.startsWith(href)
    },
    [pathname]
  )

  // Calculate submenu position based on available space
  const calculateSubmenuPosition = useCallback((key: string) => {
    const menuItem = menuItemRefs.current[key]
    const submenu = submenuRefs.current[key]

    if (!menuItem || !submenu) return

    const rect = menuItem.getBoundingClientRect()
    const submenuWidth = submenu.offsetWidth || 200 // Default min-width
    const windowWidth = window.innerWidth
    const spaceOnRight = windowWidth - rect.right
    const spaceOnLeft = rect.left
    const isNested = key.includes('-submenu-')

    if (isNested) {
      // For nested submenus, check horizontal space
      if (spaceOnRight < submenuWidth && spaceOnLeft >= submenuWidth) {
        setSubmenuPositions(prev => ({ ...prev, [key]: 'left' }))
      } else {
        setSubmenuPositions(prev => ({ ...prev, [key]: 'right' }))
      }
    } else {
      // For top-level submenus, always expand downward, but check horizontal alignment
      if (spaceOnRight < submenuWidth && spaceOnLeft >= submenuWidth) {
        setSubmenuPositions(prev => ({ ...prev, [key]: 'left' }))
      } else {
        setSubmenuPositions(prev => ({ ...prev, [key]: 'right' }))
      }
    }
  }, [])

  // Toggle submenu
  const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => {
      const isOpen = !prev[key]
      if (isOpen) {
        // Calculate position after opening
        setTimeout(() => calculateSubmenuPosition(key), 0)
      }
      return { ...prev, [key]: isOpen }
    })
  }

  // Handle mouse enter for submenu
  const handleSubmenuMouseEnter = (key: string) => {
    // Clear any pending close timeout
    if (closeTimeouts.current[key]) {
      clearTimeout(closeTimeouts.current[key]!)
      closeTimeouts.current[key] = null
    }
    setHoveredMenu(key)
    setTimeout(() => calculateSubmenuPosition(key), 0)
  }

  // Handle mouse leave with delay
  const handleSubmenuMouseLeave = (key: string) => {
    // Clear any existing timeout
    if (closeTimeouts.current[key]) {
      clearTimeout(closeTimeouts.current[key]!)
    }
    // Delay closing to allow mouse to move to submenu
    closeTimeouts.current[key] = setTimeout(() => {
      setHoveredMenu(prev => prev === key ? null : prev)
      closeTimeouts.current[key] = null
    }, 150)
  }

  // Render menu item (with optional parent key for nested menus)
  const renderMenuItem = (item: MenuNode, index: number, parentKey?: string) => {
    const getLabel = (node: MenuNode) => {
      const key = (node as any).i18nKey as string | undefined
      if (!key) return node.label
      const has = (t as any).has ? (t as any).has(key) : true
      if (!has) return node.label
      return t(key)
    }

    if (isMenuSection(item)) {
      return (
        <div key={`section-${index}`} className='topmenu-section-divider'>
          <span className='topmenu-section-text'>{getLabel(item)}</span>
        </div>
      )
    }

    if (isMenuSubMenu(item)) {
      const submenuKey = parentKey ? `${parentKey}-submenu-${index}` : `submenu-${index}`
      const isOpen = Boolean(
        openSubmenus[submenuKey] ||
          hoveredMenu === submenuKey ||
          (hoveredMenu && hoveredMenu.startsWith(submenuKey))
      )
      const hasActiveChild = item.children?.some(child =>
        isMenuItem(child) && isActive(child.href, child.exactMatch, child.activeUrl)
      )
      const position = submenuPositions[submenuKey] || 'right'
      const isNested = !!parentKey

      return (
        <div
          key={submenuKey}
          ref={el => {
            menuItemRefs.current[submenuKey] = el
          }}
          className={`topmenu-item-wrapper topmenu-item-submenu ${hasActiveChild ? 'active' : ''} ${isNested ? 'topmenu-item-nested' : ''}`}
          onMouseEnter={() => handleSubmenuMouseEnter(submenuKey)}
          onMouseLeave={() => handleSubmenuMouseLeave(submenuKey)}
        >
          <button
            className='topmenu-item-button'
            onClick={() => toggleSubmenu(submenuKey)}
            aria-expanded={isOpen}
          >
            {item.icon && <Icon icon={item.icon} className='topmenu-item-icon' />}
            <span className='topmenu-item-text'>{getLabel(item)}</span>
            {item.suffix && (
              <span className='topmenu-item-badge'>{item.suffix.label}</span>
            )}
            <Icon
              icon={isNested ? 'tabler-chevron-right' : 'tabler-chevron-down'}
              className={`topmenu-item-arrow ${isOpen ? 'open' : ''}`}
            />
          </button>
          {isOpen && item.children && (
            <div
              ref={el => {
                submenuRefs.current[submenuKey] = el
              }}
              className={`topmenu-submenu topmenu-submenu-${position} ${isNested ? 'topmenu-submenu-nested' : ''}`}
              onMouseEnter={() => handleSubmenuMouseEnter(submenuKey)}
              onMouseLeave={() => handleSubmenuMouseLeave(submenuKey)}
            >
              {item.children.map((child, childIndex) => renderMenuItem(child, childIndex, submenuKey))}
            </div>
          )}
        </div>
      )
    }

    if (isMenuItem(item)) {
      const active = isActive(item.href, item.exactMatch, item.activeUrl)

      return (
        <Link
          key={`item-${index}`}
          href={item.href || '#'}
          className={`topmenu-item topmenu-item-link ${active ? 'active' : ''}`}
        >
          {item.icon && <Icon icon={item.icon} className='topmenu-item-icon' />}
          <span className='topmenu-item-text'>{getLabel(item)}</span>
          {item.suffix && (
            <span className='topmenu-item-badge'>{item.suffix.label}</span>
          )}
        </Link>
      )
    }

    return null
  }

  // Filter out sections and flatten their children
  const flattenMenuItems = (items: MenuNode[]): MenuNode[] => {
    const result: MenuNode[] = []
    items.forEach(item => {
      if (isMenuSection(item)) {
        // For sections, add their children
        if (item.children) {
          result.push(...flattenMenuItems(item.children))
        }
      } else {
        result.push(item)
      }
    })
    return result
  }

  const menuItems = flattenMenuItems(navItems)

  // Recalculate positions on window resize
  useEffect(() => {
    const handleResize = () => {
      Object.keys(openSubmenus).forEach(key => {
        if (openSubmenus[key]) {
          calculateSubmenuPosition(key)
        }
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [openSubmenus, calculateSubmenuPosition])

  return (
    <nav className='topmenu-navbar'>
      <div className='topmenu-nav'>
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </div>
    </nav>
  )
}

export default TopMenuHeader

