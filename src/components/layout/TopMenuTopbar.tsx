'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

// Component Imports
import Logo from '@components/Logo'
import ThemeSwitcher from '@components/theme/ThemeSwitcher'
import Icon from '@components/Icon'
import UserDropdown from '../ui/UserDropdown'
import CurrentUserDisplay from '../ui/CurrentUserDisplay'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import { getWorkspaceSettings } from '@/services/settings'
import { useStorefrontConfig } from '@/contexts/StorefrontConfigContext'

// Hook Imports
import { useAppLayout } from '@/hooks/useLayoutSettings'

type Props = {
  avatarInitial?: string
}

const normalizePath = (path: string | null) =>
  path?.replace(/^\/[a-z]{2}(-[A-Z]{2})?(?=\/|$)/, '') || '/'

const TopMenuTopbar = ({ avatarInitial = 'N' }: Props) => {
  const { updateConfig } = useAppLayout()
  const pathname = usePathname()
  const normalizedPath = normalizePath(pathname ?? null)
  const { config: storefrontConfig } = useStorefrontConfig()
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

  const isAccount = normalizedPath.startsWith('/account')
  const displayName = isAccount && storefrontConfig?.site_name
    ? storefrontConfig.site_name
    : workspaceName

  const handleSwitchToVertical = () => {
    updateConfig({ menuPosition: 'vertical' })
  }

  return (
    <div className='topmenu-topbar'>
      <div className='topmenu-topbar-left'>
        <Logo name={displayName} logoSrc={workspaceLogoSrc} />
      </div>
      <div className='topmenu-topbar-right'>
        <CurrentUserDisplay />
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

