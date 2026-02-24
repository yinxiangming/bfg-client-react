'use client'

// Component Imports
import Logo from '@components/Logo'
import ThemeSwitcher from '@components/theme/ThemeSwitcher'
import Icon from '@components/Icon'
import UserDropdown from '../ui/UserDropdown'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'

// Hook Imports
import { useAppLayout } from '@/hooks/useLayoutSettings'

type Props = {
  avatarInitial?: string
}

const TopMenuTopbar = ({ avatarInitial = 'N' }: Props) => {
  const { updateConfig } = useAppLayout()

  const handleSwitchToVertical = () => {
    updateConfig({ menuPosition: 'vertical' })
  }

  return (
    <div className='topmenu-topbar'>
      <div className='topmenu-topbar-left'>
        <Logo />
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

