'use client'

// React Imports
import { useState, useRef, useEffect } from 'react'

// Component Imports
import Icon from '@components/Icon'

// Context Imports
import { useAdminSkin } from '@/contexts/AdminSkinContext'

const AdminSkinSwitcher = () => {
  const { skin, setSkin, skins } = useAdminSkin()
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

  return (
    <div className='skin-switcher theme-switcher' ref={dropdownRef}>
      <button
        type='button'
        className='admin-topbar-btn'
        onClick={() => setIsOpen(!isOpen)}
        aria-label='Switch admin skin'
        aria-expanded={isOpen}
      >
        <Icon icon='tabler-palette' />
      </button>
      {isOpen && (
        <div className='theme-switcher-dropdown'>
          {skins.map(option => {
            const isSelected = skin === option.id
            return (
              <button
                key={option.id}
                type='button'
                className={`theme-switcher-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSkin(option.id)
                  setIsOpen(false)
                }}
              >
                <span className={`skin-swatch skin-swatch--${option.id}`} aria-hidden='true' />
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

export default AdminSkinSwitcher
