'use client'

import { useEffect, useRef, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Component Imports
import Icon from '@components/Icon'

// Util Imports
import { meApi } from '@/utils/meApi'
import { authApi } from '@/utils/authApi'

import { getAvatarUrl } from '@/utils/media'

type UserInfo = {
  name: string
  email: string
  avatar?: string
}

type Props = {
  /**
   * Optional initial used by some layouts. Currently unused but kept for API compatibility.
   */
  avatarInitial?: string
}

const menuItems = [
  { label: 'Settings', icon: 'tabler-settings', href: '/account/settings' },
  { label: 'Orders', icon: 'tabler-shopping-cart', href: '/account/orders' },
  { label: 'Addresses', icon: 'tabler-map-pin', href: '/account/addresses' }
]

const UserDropdown = (_props: Props) => {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      if (!authApi.isAuthenticated()) {
        setUser(null)
        return
      }
      try {
        const data = await meApi.getMe()
        const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || data.username || 'User'
        setUser({
          name: fullName,
          email: data.email || '',
          avatar: data.avatar || ''
        })
      } catch (error) {
        console.error('Failed to load user info:', error)
        setUser(null)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (!open) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const closeMenu = () => setOpen(false)
  const toggleMenu = () => setOpen(prev => !prev)

  const handleNavigate = (href: string) => {
    router.push(href)
    closeMenu()
  }

  const handleUserLogout = () => {
    authApi.logout()
    router.push('/auth/login')
    closeMenu()
  }

  const avatarSrc = getAvatarUrl(user?.avatar)
  const avatarAlt = user?.name || 'User'

  const renderAvatar = (size: 'sm' | 'lg') => {
    const className = size === 'sm' ? 'user-avatar' : 'user-info-avatar'

    if (avatarSrc) {
      return (
        <div className={className}>
          <img src={avatarSrc} alt={avatarAlt} />
          {size === 'sm' && <span className='user-status-dot' aria-hidden />}
        </div>
      )
    }

    const fallback = avatarAlt?.charAt(0)?.toUpperCase() || 'U'
    return (
      <div className={className}>
        <span>{fallback}</span>
        {size === 'sm' && <span className='user-status-dot' aria-hidden />}
      </div>
    )
  }

  return (
    <div className='user-menu' ref={menuRef}>
      <button
        type='button'
        className='user-avatar-trigger'
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={toggleMenu}
      >
        {renderAvatar('sm')}
      </button>

      {open && (
        <div className='user-dropdown' role='menu'>
          <div className='user-info'>
            {renderAvatar('lg')}
            <div className='user-info-meta'>
              <div className='user-info-name'>{user?.name || 'User'}</div>
              <div className='user-info-email'>{user?.email || ''}</div>
            </div>
          </div>

          <div className='user-menu-items'>
            {menuItems.map(item => (
              <button
                key={`${item.href}:${item.label}`}
                type='button'
                className='user-menu-item'
                onClick={() => handleNavigate(item.href)}
              >
                <Icon icon={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <button type='button' className='user-logout-btn' onClick={handleUserLogout}>
            <span>Logout</span>
            <Icon icon='tabler-logout-2' />
          </button>
        </div>
      )}
    </div>
  )
}

export default UserDropdown


