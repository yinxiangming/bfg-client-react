'use client'

/**
 * The customer account shell: the grouped menu, a topbar with only what a shopper
 * uses, and the page.
 *
 * The account used to borrow the back office's `SideMenuLayout`, whose topbar
 * carries the skin, layout, feedback and AI assistant controls. None of those mean
 * anything to a shopper, so the account has its own topbar and keeps the shared
 * `Sidebar`.
 */

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

import Icon from '@components/Icon'
import Sidebar from '@components/layout/Sidebar'
import AccountTopbar from '@/components/account/AccountTopbar'
import { useAccount } from '@/contexts/AccountContext'
import { isMenuSection, isMenuSubMenu } from '@/types/menu'
import type { MenuBadge, MenuNode } from '@/types/menu'

/** Matches the drawer breakpoint in styles/layout.css. */
const MOBILE_BREAKPOINT = 960

/** Hang a count on the nav items it belongs to, by id, wherever they sit in the tree. */
const withBadges = (items: MenuNode[], badges: Record<string, MenuBadge>): MenuNode[] =>
  items.map(item => {
    if (isMenuSection(item) || isMenuSubMenu(item)) {
      return { ...item, children: withBadges(item.children, badges) }
    }

    return badges[item.id] ? { ...item, suffix: badges[item.id] } : item
  })

type Props = {
  navItems: MenuNode[]
  children: ReactNode
}

export default function AccountShell({ navItems, children }: Props) {
  const pathname = usePathname()
  const t = useTranslations('account')
  const { stats } = useAccount()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)

    check()
    window.addEventListener('resize', check)

    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const items = useMemo(() => {
    const badges: Record<string, MenuBadge> = {}
    const pendingOrders = stats?.order_counts?.pending ?? 0
    const unread = stats?.unread_messages_count ?? 0

    if (pendingOrders > 0) badges.orders = { label: pendingOrders, color: 'warning' }
    if (unread > 0) badges.inbox = { label: unread, color: 'primary' }

    return withBadges(navItems, badges)
  }, [navItems, stats])

  return (
    <div className='admin-shell account-shell' data-admin-skin='slate'>
      <Sidebar
        navItems={items}
        activePath={pathname}
        mobileOpen={mobileOpen}
        footer={
          <Link href='/' className='menu-link'>
            <span className='menu-icon'>
              <Icon icon='tabler-building-store' />
            </span>
            <span className='menu-label'>{t('nav.backToStore')}</span>
          </Link>
        }
      />
      {isMobile && mobileOpen && <div className='sidebar-overlay' onClick={() => setMobileOpen(false)} />}
      <div className='admin-main'>
        <div className='admin-content'>
          <AccountTopbar
            navItems={items}
            showMenuToggle={isMobile}
            onMenuToggle={() => setMobileOpen(open => !open)}
          />
          <main className='account-content-body'>{children}</main>
        </div>
      </div>
    </div>
  )
}
