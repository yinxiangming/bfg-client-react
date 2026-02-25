'use client'

// React Imports
import { useState, useEffect } from 'react'

// Component Imports
import Logo from '@components/Logo'
import ThemeSwitcher from '@components/theme/ThemeSwitcher'
import Icon from '@components/Icon'
import UserDropdown from '../ui/UserDropdown'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import { getWorkspaceSettings } from '@/services/settings'

// Hook Imports
import { useAppLayout } from '@/hooks/useLayoutSettings'

type Props = {
  avatarInitial?: string
}

const TopMenuTopbar = ({ avatarInitial = 'N' }: Props) => {
  const { updateConfig } = useAppLayout()
  const [workspaceName, setWorkspaceName] = useState<string | undefined>(undefined)
  const [workspaceLogoSrc, setWorkspaceLogoSrc] = useState<string | undefined>(undefined)

  useEffect(() => {
    getWorkspaceSettings()
      .then(s => {
        setWorkspaceName(s.site_name ?? undefined)
        const logo = s.custom_settings?.general?.logo ?? s.logo
        setWorkspaceLogoSrc(logo ?? undefined)
      })
      .catch(() => {})
  }, [])

  const handleSwitchToVertical = () => {
    updateConfig({ menuPosition: 'vertical' })
  }

  return (
    <div className='topmenu-topbar'>
      <div className='topmenu-topbar-left'>
        <Logo name={workspaceName} logoSrc={workspaceLogoSrc} />
      </div>
      <div className='topmenu-topbar-right'>
        <button
          type='button'
          className='topmenu-layout-btn'
          onClick={handleSwitchToVertical}
          aria-label='Switch to vertical layout'
        >
          <Icon icon='tabler-layout-sidebar' />
        </button>
        <ThemeSwitcher />
        <LanguageSwitcher />
        <UserDropdown avatarInitial={avatarInitial} />
      </div>
    </div>
  )
}

export default TopMenuTopbar

