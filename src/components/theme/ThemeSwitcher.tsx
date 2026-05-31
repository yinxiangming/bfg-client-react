'use client'

// React Imports
import { useState, useRef, useEffect } from 'react'

// Component Imports
import Icon from '@components/Icon'

// Context Imports
import { useTheme } from '@/contexts/ThemeContext'
import { useStorefrontConfig } from '@/contexts/StorefrontConfigContext'
import { getAllowedColorModes } from '@/utils/storefrontConfig'

// Type Imports
import type { Mode } from '@/types/core'

const ThemeSwitcher = () => {
  const { mode, systemMode, setMode } = useTheme()
  const { config } = useStorefrontConfig()
  const allowed = getAllowedColorModes(config)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (selectedMode: Mode) => {
    setMode(selectedMode)
    setIsOpen(false)
  }

  const getCurrentIcon = () => {
    const effectiveMode = mode === 'system' ? systemMode : mode
    return effectiveMode === 'dark' ? 'tabler-moon' : 'tabler-sun'
  }

  const allOptions: { mode: Mode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Light', icon: 'tabler-sun' },
    { mode: 'dark', label: 'Dark', icon: 'tabler-moon-stars' },
    { mode: 'system', label: 'System', icon: 'tabler-device-desktop' }
  ]
  const options = allOptions.filter(o => o.mode === 'system' || allowed.includes(o.mode as 'light' | 'dark'))

  // Single allowed mode means there is no choice to make, but hooks must stay stable.
  if (allowed.length <= 1) return null

  return (
    <div className='theme-switcher' ref={dropdownRef}>
      <button
        type='button'
        className='admin-topbar-btn'
        onClick={() => setIsOpen(!isOpen)}
        aria-label='Toggle theme'
        aria-expanded={isOpen}
      >
        <Icon icon={getCurrentIcon()} />
      </button>
      {isOpen && (
        <div className='theme-switcher-dropdown'>
          {options.map(option => {
            const isSelected = mode === option.mode
            return (
              <button
                key={option.mode}
                type='button'
                className={`theme-switcher-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(option.mode)}
              >
                <Icon icon={option.icon} />
                <span>{option.label}</span>
                {isSelected && <Icon icon='tabler-check' className='check-icon' />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ThemeSwitcher
