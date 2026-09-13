'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'

import Logo from '@/components/Logo'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import ThemeSwitcher from '@/components/theme/ThemeSwitcher'
import UserDropdown from '@/components/ui/UserDropdown'
import { useStorefrontConfigSafe } from '@/contexts/StorefrontConfigContext'
import { meApi } from '@/utils/meApi'

type SignedInUser = {
  name: string
  email: string
}

/**
 * The /workspaces bar: the site's brand, the language and colour-mode switchers, and the
 * signed-in user. It reuses the admin topbar's controls but leaves out the ones that act
 * on a workspace (skin, feedback, assistant, workspace switcher), since none is picked yet.
 */
export default function WorkspacesTopbar() {
  const config = useStorefrontConfigSafe()
  const [user, setUser] = useState<SignedInUser | null>(null)

  useEffect(() => {
    let cancelled = false

    meApi
      .getMe()
      .then(me => {
        if (cancelled) return
        const name = [me?.first_name, me?.last_name].filter(Boolean).join(' ').trim() || me?.username || ''
        setUser({ name, email: me?.email || '' })
      })
      // Only the name and email go missing; the avatar menu still offers sign-out.
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

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
        px: 3,
        backgroundColor: 'var(--at-card-bg)',
        borderBottom: '1px solid var(--at-card-border)',
        // Logo is sized for the admin sidebar; fit it to a 56px bar.
        '& .sidebar-logo-icon': { fontSize: 28, height: '28px !important' },
        '& .sidebar-logo-text': {
          fontFamily: 'var(--at-font-display)',
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '-0.01em'
        },
        // The switchers open from their left edge, which suits the admin's left-hand
        // toolbar; on the right of the bar that runs off a narrow screen.
        '& .theme-switcher-dropdown': { left: 'auto', right: 0 }
      }}
    >
      <Logo skipLink name={config.site_name?.trim() || undefined} logoSrc={config.logo} logoDarkSrc={config.logo_dark} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LanguageSwitcher />
        <ThemeSwitcher />
        {user && (
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <div className='current-user-display'>
              <span className='current-user-display-name'>{user.name}</span>
              {user.email && <span className='current-user-display-email'>{user.email}</span>}
            </div>
          </Box>
        )}
        <UserDropdown />
      </Box>
    </Box>
  )
}
