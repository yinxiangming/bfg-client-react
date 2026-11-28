'use client'

import { useTranslations } from 'next-intl'

import Box from '@mui/material/Box'

import Icon from '@components/Icon'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import UserDropdown from '@/components/ui/UserDropdown'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'

type Props = {
  /** Narrow screens, where the tree is a drawer rather than a column. */
  showMenuToggle?: boolean
  onMenuToggle?: () => void
}

/**
 * The console's bar: the site's brand, the language and colour-mode switchers, and the
 * signed-in user. It reuses the admin topbar's controls but leaves out the ones that act
 * on a workspace (skin, feedback, assistant, workspace switcher), since the console spans
 * every workspace the account runs rather than working inside one.
 */
export default function ConsoleTopbar({ showMenuToggle, onMenuToggle }: Props) {
  const config = useStorefrontConfigSafe()
  const t = useTranslations('admin.console')

  return (
    <Box
      component='header'
      sx={{
        height: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: { xs: 2, sm: 3 },
        backgroundColor: 'var(--at-card-bg)',
        borderBottom: '1px solid var(--at-card-border)',
        // The switchers open from their left edge, which suits the admin's left-hand
        // toolbar; on the right of the bar that runs off a narrow screen.
        '& .theme-switcher-dropdown': { left: 'auto', right: 0 }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {showMenuToggle && (
          <button type='button' className='topbar-menu-toggle' onClick={onMenuToggle} aria-label={t('topbar.menu')}>
            <Icon icon='tabler-menu-2' />
          </button>
        )}
        {/* The tree carries the logo; the bar only names the site, as the account's does. */}
        <Box
          component='span'
          sx={{
            fontFamily: 'var(--at-font-display)',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--at-row-fg)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {config.site_name?.trim()}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <LanguageSwitcher />
        <ThemeSwitcher />
        <UserDropdown showName />
      </Box>
    </Box>
  )
}
