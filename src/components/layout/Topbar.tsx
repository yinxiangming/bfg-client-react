'use client'

// React Imports
import { useState, useRef, useEffect } from 'react'

// Component Imports
import Icon from '@components/Icon'
import ThemeSwitcher from '@components/theme/ThemeSwitcher'
import UserDropdown from '../ui/UserDropdown'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'

// Hook Imports
import { useAppLayout } from '@/hooks/useLayoutSettings'

type Props = {
  avatarInitial?: string
  onMenuToggle?: () => void
  showMenuToggle?: boolean
}

const Topbar = ({ avatarInitial = 'N', onMenuToggle, showMenuToggle }: Props) => {
  const { config, updateConfig } = useAppLayout()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleLayoutChange = (menuPosition: 'vertical' | 'horizontal') => {
    updateConfig({ menuPosition })
    setIsMenuOpen(false)
  }

  return (
    <header className='admin-topbar'>
      <div className='admin-topbar-left'>
        {showMenuToggle && (
          <button
            type='button'
            className='topbar-menu-toggle'
            onClick={onMenuToggle}
            aria-label='Toggle menu'
          >
            <Icon icon='tabler-menu-2' />
          </button>
        )}
        <ThemeSwitcher />
        <LanguageSwitcher />
        <div className='admin-topbar-layout-switcher' ref={menuRef}>
          <button
            type='button'
            className='admin-topbar-btn'
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label='Switch layout'
            aria-expanded={isMenuOpen}
          >
            <Icon icon='tabler-layout' />
          </button>
          {isMenuOpen && (
            <div className='layout-switcher-dropdown'>
              <button
                type='button'
                className={`layout-switcher-option ${config.menuPosition === 'vertical' ? 'selected' : ''}`}
                onClick={() => handleLayoutChange('vertical')}
              >
                <Icon icon='tabler-layout-sidebar' />
                <span>Side Menu</span>
                {config.menuPosition === 'vertical' && <Icon icon='tabler-check' className='check-icon' />}
              </button>
              <button
                type='button'
                className={`layout-switcher-option ${config.menuPosition === 'horizontal' ? 'selected' : ''}`}
                onClick={() => handleLayoutChange('horizontal')}
              >
                <Icon icon='tabler-layout-navbar' />
                <span>Top Menu</span>
                {config.menuPosition === 'horizontal' && <Icon icon='tabler-check' className='check-icon' />}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className='admin-topbar-right'>
        <UserDropdown avatarInitial={avatarInitial} />
      </div>
    </header>
  )
}

export default Topbar

