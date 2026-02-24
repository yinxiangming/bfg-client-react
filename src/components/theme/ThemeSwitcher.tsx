'use client'

// React Imports
import { useState, useRef, useEffect } from 'react'

// Component Imports
import Icon from '@components/Icon'

// Context Imports
import { useTheme } from '@/contexts/ThemeContext'

// Type Imports
import type { Mode } from '@/types/core'

const ThemeSwitcher = () => {
  const { mode, systemMode, setMode } = useTheme()
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

  const options: { mode: Mode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Light', icon: 'tabler-sun' },
    { mode: 'dark', label: 'Dark', icon: 'tabler-moon-stars' },
    { mode: 'system', label: 'System', icon: 'tabler-device-desktop' }
  ]

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

